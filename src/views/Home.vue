<template>
	<div class="grid-container">
		<div class="main-content">
			<form class="search-bar" @submit.prevent="handleSearch">
				<input type="text" placeholder="Search for posts, users, and communities..." />
				<button type="submit">Search</button>
			</form>

			<h2 v-show="!isUserLoggedIn">Sign in to create posts and comment</h2>
			<router-link to="/create-post" v-show="isUserLoggedIn">Create Post</router-link>

			<div class="sort-by-container">
				<span>Sort by: </span>
				<select class="sort-by">
					<option value="top">Top</option>
					<option value="new">New</option>
					<option value="hot">Hot</option>
				</select>
			</div>

			<div id="posts-container">
				<div v-for="post in posts" :key="post.id" class="post" ref="posts">
					<router-link class='post-link' :to="{ name: 'post-details', params: { postID: post.id, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">
						<div class="post-metadata">
							<span class="post-author">{{ post.authorUsername }}</span> |
							<span class="post-date">{{ post.postDate }}</span>
							<span class="post-last-edited-date" v-if="post.lastEdited != ''" >Last edited: {{ post.lastEdited }}</span>
							<router-link class="post-community" :to="{ name: 'communities', params: { communityName: post.community, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">{{ post.community }}</router-link>
						</div>
						<h2 v-html="post.titleHTML" class="post-title"></h2>
						<p v-html="post.contentHTML" class="post-content"></p>
					</router-link>

					<button class="like-button" @click="like(post.id, post.isLikedByCurrentUser)" v-show="isUserLoggedIn">Like</button>
					<span class="likes-count">{{ post.likes.length }} likes</span>
				</div>
			</div>
		</div>
		
		<Sidebar 
			:isUserLoggedIn="isUserLoggedIn"
			:loggedInUsername="loggedInUsername"
			:isCommunitySidebar="false"
		/>

		<!-- pagination button to be added later
		<button>Load More</button> 
		-->
	</div>
</template>

<script>
	import { db } from '@/firebase';
	import { collection, query, where, getDocs, addDoc, orderBy, startAfter, limit, getDoc, doc, updateDoc } from "firebase/firestore";

	import Sidebar from '@/components/Sidebar.vue';

	export default {
		data() {
			return {
				posts: [],
				topCommunities: [],
			}
		},
		components: {
			Sidebar
		},
		props: [
			'isUserLoggedIn',
			'loggedInUsername'
		],
		methods: {
			handleSearch() {
				// perform search
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
		},
		async mounted() {
			// get most recent posts right now, but need to be ordered by likes most reecently (add like/dislike)
			this.posts = [];

			let q = query(collection(db, 'userPosts'), orderBy('postDate', 'desc'));
			let querySnapshot = await getDocs(q);
			querySnapshot.forEach(doc => {
				let isLikedByCurrentUser = false;
				if (this.isUserLoggedIn == true) {
					doc.data().likes.forEach(likedByUsername => {
						if (likedByUsername == this.loggedInUsername) {
							isLikedByCurrentUser = true;
							return;
						}
					});
				}
				this.posts.push({
					id: doc.id,
					titleHTML: doc.data().titleHTML,
					contentHTML: doc.data().contentHTML,
					postDate: doc.data().postDate.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
					authorUsername: doc.data().authorUsername,
					lastEdited: doc.data().lastEdited != '' ? doc.data().lastEdited.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '',
					likes: doc.data().likes,
					dislikes: doc.data().dislikes,
					community: doc.data().community,
					isLikedByCurrentUser: isLikedByCurrentUser,
				});
			});

			// pagination to be added later: https://firebase.google.com/docs/firestore/query-data/query-cursors
		}
	}
</script>

<style scoped>
	.grid-container {
		display: grid;
		max-width: 900px;
		grid-template-columns: 2fr 1fr;
		margin: auto;
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
	}

	form button {
		margin: 10px;
		padding: 10px;
	}

	.post {
		border: 1px solid black;
		text-align: left;
		max-width: 600px;
		margin: 10px auto;
	}

	.post-metadata {
		font-size: 16px;
	}

	.post-title {
		margin-top: -15px;
		margin-bottom: -10px;
	}

	.post-content {
		margin-top: 30px;
	}

	.post a {
		color: default;
		text-decoration: none;
		color: black;
	}

	.post-last-edited-date {
		display: block;
	}

	.likes-count, .dislikes-count {
		margin-right: 5px;
	}

	.post-community {
		display: block;
		color: blue !important;
		margin-top: 10px;
		text-decoration: underline !important;
	}
</style>