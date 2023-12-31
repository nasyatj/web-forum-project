<template>
	<div class="grid-container" v-show="doneLoading">
		<div class="main-content">
			<form class="search-bar" @submit.prevent="handleSearch">
				<input v-model="searchTerm" type="text" id="search-bar" placeholder="Search for posts..." />
				<button @click="search">Search</button>
				<button @click="clearSearch">Clear</button>
			</form>

			<h2 v-show="!isUserLoggedIn">Sign In To Create Posts And Comment</h2>
			<router-link to="/create-post" v-show="isUserLoggedIn">Create Post</router-link>

			<div class="sort-by-container">
				<span>Sort by: </span>
				<select class="sort-by" v-model="sortBySelect">
					<option value="new" selected>New</option>
					<option value="top">Top</option>
				</select>
			</div>

			<div id="posts-container">
				<h2 v-show="isSearchResults == true && posts.length == 0">No posts found with those terms</h2>
				<div v-for="post in posts" :key="post.id" class="post" v-show="post.type == 'post'">
					<router-link class='post-link' :to="{ name: 'post-details', params: { postID: post.id, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">
						<div class="post-metadata">
							<span class="post-author">{{ post.authorUsername }}</span> |
							<span class="post-date">{{ post.postDate }}</span>
							<span class="post-flair" :style="{ backgroundColor: post.flair.color }">{{ post.flair.text }}</span>
							<span class="post-last-edited-date" v-if="post.lastEdited != ''" >Last edited: {{ post.lastEdited }}</span>
							<router-link class="post-community" :to="{ name: 'communities', params: { communityName: post.community, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">{{ post.community }}</router-link>
						</div>
						<h2 v-html="post.titleHTML" class="post-title"></h2>
						<p v-html="post.contentHTML" class="post-content"></p>
						<p class="image-box"><img :src="post.imgLinkPlain" width="400" /></p>
					</router-link>

					<button class="like-button" @click="like(post.id, post.isLikedByCurrentUser)" v-show="isUserLoggedIn">{{ post.isLikedByCurrentUser ? 'Unlike' : 'Like' }}</button>
					<span class="likes-count">{{ post.likes.length }} likes</span>

					<button class="bookmark-button" @click="bookmark(post.id, post.isBookmarkedByCurrentUser)" v-show="isUserLoggedIn">{{ post.isBookmarkedByCurrentUser ? 'Unbookmark' : 'Bookmark' }}</button>
				</div>

				<!--
				<h2 v-show="isSearchResults == true && posts.length != 0">Communities Search Results:</h2>
				<div v-for="post in posts" :key="post.id" class="community" v-show="post.type == 'comment'">
					<router-link class='community-link' :to="{ name: 'communities', params: { communityName: post.name, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">
						<h2 class="community-name">{{ post.name }}</h2>
						<div class="community-members">{{ post.membersLength }}</div>
						<p class="community-description">{{ post.description }}</p>
					</router-link>
				</div>
				-->
			</div>
		</div>
		
		<Sidebar
			:isUserLoggedIn="isUserLoggedIn"
			:loggedInUsername="loggedInUsername"
			:isCommunitySidebar="false"
		/>
	</div>

	<!-- Spinner -->
	<div class="lds-dual-ring" v-show="!doneLoading">Loading...</div>
</template>

<script>
	import { db } from '@/firebase';
	import { collection, query, where, or, getDocs, addDoc, orderBy, startAfter, limit, getDoc, and, doc, updateDoc } from "firebase/firestore";

	import Sidebar from '@/components/Sidebar.vue';

	export default {
		data() {
			return {
				posts: [],
				lastPost: null,
				topCommunities: [],
				loadingMore: false,
				doneLoading: false,
				sortBySelect: 'new',
				searchTerm: '',
				isSearchResults: false,
				communitiesSearchResults: [],
			}
		},
		components: {
			Sidebar
		},
		watch: {
			sortBySelect(newVal, oldVal) {
				if (newVal == 'new') {
					function compare(a, b) {
						if (a.postDateTimestamp.seconds > b.postDateTimestamp.seconds)
							return -1;
						else if (a.postDateTimestamp.seconds < b.postDateTimestamp.seconds)
							return 1;
						else
							return 0;
					}
					this.posts.sort(compare);
				}
				else if (newVal == 'top') {
					function compare(a, b) {
						if (a.likes.length > b.likes.length)
							return -1;
						else if (a.likes.length < b.likes.length)
							return 1;
						else
							return 0;
					}
					this.posts.sort(compare);
				}
			}
		},
		props: [
			'isUserLoggedIn',
			'loggedInUsername'
		],
		methods: {
			async bookmark(postID, isBookmarkedByCurrentUser) {
				this.posts.forEach(post => {
					if (post.id == postID)
						post.isBookmarkedByCurrentUser = !isBookmarkedByCurrentUser;
				});

				let q = query(collection(db, 'users'), where('username', '==', this.loggedInUsername));
				let querySnapshot = await getDocs(q);
				let userID = querySnapshot.docs[0].id;
				let updatedBookmarks = querySnapshot.docs[0].data().bookmarks;

				// un-bookmark
				if (isBookmarkedByCurrentUser == true)
					updatedBookmarks = updatedBookmarks.filter(bookmarkPostID => bookmarkPostID != postID);
				// bookmark
				else
					updatedBookmarks.push(postID);

				await updateDoc(doc(db, 'users', userID), {
					bookmarks: updatedBookmarks,
				});
			},
			async like(postID, isLikedByCurrentUser) {
				let updatedLikes = [];

				this.posts.forEach((post, index) => {
					if (post.id == postID) {
						// unlike
						if (isLikedByCurrentUser == true)
							post.likes = post.likes.filter(username => { return username != this.loggedInUsername; });
						// like
						else 
							post.likes.push(this.loggedInUsername);

						updatedLikes = post.likes;
						post.isLikedByCurrentUser = !isLikedByCurrentUser;
					}
				});

				await updateDoc(doc(db, 'userPosts', postID), {
					likes: updatedLikes
				});
			},
			async search() {
				if (this.searchTerm.length < 3) {
					alert('Atleast 3 characters required for search');
					return;
				}
				this.isSearchResults = true;

				await this.fetchPosts();
				this.doneLoading = false;

				// search posts
				let postHits = [];
				for (const post of this.posts) {
					if (post.titlePlainText.toLowerCase().includes(this.searchTerm.toLowerCase()) || post.contentPlainText.toLowerCase().includes(this.searchTerm.toLowerCase())) {
						postHits.push(post);
					}
				}

				/*
				// search communities
				let querySnapshot = await getDocs(collection(db, 'communities'));
				for (const doc of querySnapshot.docs) {
					if (doc.data().name.toLowerCase().includes(this.searchTerm.toLowerCase())) {
						postHits.push({
							id: doc.id,
							type: 'comment',
							name: doc.data().name,
							description: doc.data().description,
							membersLength: doc.data().membersLength,
						});
					}
				}
				console.log(postHits);
				*/
				this.posts = postHits;

				this.doneLoading = true;
			},
			async clearSearch() {
				this.isSearchResults = false;
				this.searchTerm = '';
				await this.fetchPosts();
			},
			async fetchPosts() {
				this.doneLoading = false;

				// get most recent posts right now, but need to be ordered by likes most reecently (add like/dislike)
				this.posts = [];

				let q = query(collection(db, 'userPosts'), orderBy('postDate', 'desc'), limit(5));
				let querySnapshot = await getDocs(q);
				for (const doc of querySnapshot.docs) {
					// find out if post liked by current logged in user
					let isLikedByCurrentUser = false;
					if (this.isUserLoggedIn == true) {
						doc.data().likes.forEach(likedByUsername => {
							if (likedByUsername == this.loggedInUsername) {
								isLikedByCurrentUser = true;
								return;
							}
						});
					}

					// find out if post bookmarked by current logged in user
					let isBookmarkedByCurrentUser = false;
					if (this.isUserLoggedIn == true) {
						let temp = await getDocs(query(collection(db, 'users'), where('username', '==', this.loggedInUsername), where('bookmarks', 'array-contains', doc.id)));
						if (temp.docs.length > 0)
							isBookmarkedByCurrentUser = true;
					}

					this.posts.push({
						id: doc.id,
						type: 'post',
						titleHTML: doc.data().titleHTML,
						titlePlainText: doc.data().titlePlainText,
						contentHTML: doc.data().contentHTML,
						contentPlainText: doc.data().contentPlainText,
						imgLinkPlain: doc.data().imgLinkPlain,
						postDate: doc.data().postDate.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
						authorUsername: doc.data().authorUsername,
						lastEdited: doc.data().lastEdited != '' ? doc.data().lastEdited.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '',
						likes: doc.data().likes,
						dislikes: doc.data().dislikes,
						community: doc.data().community,
						flair: doc.data().flair,
						isLikedByCurrentUser: isLikedByCurrentUser,
						isBookmarkedByCurrentUser: isBookmarkedByCurrentUser,
						postDateTimestamp: doc.data().postDate,
					});
				}

				// Pagination - Get the last visible document
				let lastPost = querySnapshot.docs[(querySnapshot.docs.length-1)];
				this.lastPost = lastPost;

				this.doneLoading = true;
			},
			async loadMore(){
				// get most recent posts right now, but need to be ordered by likes most reecently (add like/dislike)
				const nextBatchPosts = [];

				if(this.lastPost == undefined){
					return;
				}

				let q = query(collection(db, 'userPosts'), orderBy('postDate', 'desc'), startAfter(this.lastPost), limit(5));
				let querySnapshot = await getDocs(q);

				for (const doc of querySnapshot.docs) {

					// find out if post liked by current logged in user
					let isLikedByCurrentUser = false;
					if (this.isUserLoggedIn == true) {
						doc.data().likes.forEach(likedByUsername => {
							if (likedByUsername == this.loggedInUsername) {
								isLikedByCurrentUser = true;
								return;
							}
						});
					}

					// find out if post bookmarked by current logged in user
					let isBookmarkedByCurrentUser = false;
					if (this.isUserLoggedIn == true) {
						let temp = await getDocs(query(collection(db, 'users'), where('username', '==', this.loggedInUsername), where('bookmarks', 'array-contains', doc.id)));
						if (temp.docs.length > 0)
							isBookmarkedByCurrentUser = true;
					}

					nextBatchPosts.push({
						id: doc.id,
						type: 'post',
						titleHTML: doc.data().titleHTML,
						titlePlainText: doc.data().titlePlainText,
						contentHTML: doc.data().contentHTML,
						contentPlainText: doc.data().contentPlainText,
						imgLinkPlain: doc.data().imgLinkPlain,
						postDate: doc.data().postDate.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
						authorUsername: doc.data().authorUsername,
						lastEdited: doc.data().lastEdited != '' ? doc.data().lastEdited.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '',
						likes: doc.data().likes,
						dislikes: doc.data().dislikes,
						community: doc.data().community,
						flair: doc.data().flair,
						isLikedByCurrentUser: isLikedByCurrentUser,
						isBookmarkedByCurrentUser: isBookmarkedByCurrentUser,
						postDateTimestamp: doc.data().postDate,
					});
				}

				//add next batch of posts to posts
				this.posts.push(...nextBatchPosts);

				// Pagination - Get the last visible document
				let lastPost = querySnapshot.docs[(querySnapshot.docs.length-1)];
				this.lastPost = lastPost;
			},
			async handleScroll(){
				// Check if loading is already in progress
				if (this.loadingMore) {
					return;
				}
				if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 50) {
				this.loadingMore = true;

				await this.loadMore();

				this.loadingMore = false;
				}
			}
		},
		async mounted() {
			await this.fetchPosts();
			window.addEventListener("scroll", this.handleScroll);

			
		}
	}
</script>

<style scoped>
	.grid-container {
		display: grid;
		gap: 20px; 
		max-width: 900px;
		grid-template-columns: 2fr 1fr;
		margin: auto;
		color: #008080; /* Teal Text */
	}

	.main-content {
		text-align: left;
	}

	form {
		margin: 20px;
	}

	form input {
		padding: 10px;
		width: 300px;
		border: 1px solid #008080; /* Teal Border */
	}

	form button {
		margin: 10px;
		padding: 10px;
		background-color: #FF7F50; /* Coral Background */
        	color: #FFFFFF; /* White Text */
        	border: none;
	}
	form button:hover {
        background-color: #E6735A; /* Darker Coral on Hover */
    }

	.post {
		border: 4px solid #000; /* black Border */
		text-align: left;
		background-color: #f0f0f0; /* grey-white Background */
		max-width: 600px;
		border-radius: 5px; /* Optional: Rounded corners */
		margin: 10px auto;
		color: #000; /* White text color */
	}
	.sidebar-content sticky{
		border: 3px solid orange; /* Bold orange border */
        border-radius: 10px; /* Rounded corners */
	}

	.post-metadata {
		font-size: 16px;
	}

	.post-title {
		margin-top: -15px;
		margin-bottom: -10px;
		font-size: 30px;
		color: #000;
		padding-left: 5px;
		font-family: Baskerville, 'Baskerville Old Face', 'Hoefler Text', Garamond, 'Times New Roman', serif; /* Fallbacks for Baskerville */
	}

	.image-box{
        display: block;
        margin-left: auto;
        margin-right: auto;
        width: 65%;
    }

	.post-content {
		padding-left: 30px;
		margin-top: 30px;
		font-weight: bold; /* Makes post content text bolder */
		padding-right: 20px;
	}

	.post a {
		color: #000; /* Teal Link */
        	text-decoration: none;
	}

	.post-last-edited-date {
		display: block;
	}

	.likes-count, .dislikes-count {
		margin-right: 5px;
	}

	.post-community {
		display: block;
		font-size: 20px;
		padding-left: 5px;
		font-family: Baskerville, 'Baskerville Old Face', 'Hoefler Text', Garamond, 'Times New Roman', serif; /* Fallbacks for Baskerville */
		color: #FF7F50;
		font-weight: bold;
		margin-top: 10px;
		text-decoration: underline !important;
	}

	.post-flair {
		display: inline-block;
		margin: 5px 10px;
		padding: 5px 10px;
		border-radius: 20px;
	}
</style>
