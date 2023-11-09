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

					<button class="like-button" @click="like(post.id)" v-show="isUserLoggedIn">Like</button>
					<span class="likes-count">{{ post.likes.length }} likes</span>
					<button class="dislike-button" @click="dislike(post.id)" v-show="isUserLoggedIn">Dislike</button>
					<span class="dislikes-count">{{ post.dislikes.length }} dislikes</span>
				</div>
			</div>
		</div>
		
		<div class="sidebar">
			<div class="sidebar-content">
				<div class="sidebar-community-info">
					<h3>Home</h3>
					<p>Your personal page showing latest posts from communities you've joined and the latest trending posts</p>
				</div>
				<div class="sidebar-links">
					<div v-show="!isUserLoggedIn">
						<router-link to="/sign-up" v-show="!isUserLoggedIn">Sign Up</router-link>
						<router-link to="/sign-in" v-show="!isUserLoggedIn">Sign In</router-link>
					</div>
					<div v-show="isUserLoggedIn">
						<router-link to="/create-post" v-show="isUserLoggedIn">Create Post</router-link>
						<router-link to="/create-community" v-show="isUserLoggedIn">Create Community</router-link>
					</div>
				</div>
				<div class="sidebar-popular-communities">
					<h3>Popular Communities</h3>
					<router-link v-for="topCommunity in topCommunities" :to="{ name: 'communities', params: { communityName: topCommunity.name, isUserLoggedIn: this.isUserLoggedIn, loggedInUsername: this.loggedInUsername }}">
						<h4>{{ topCommunity.name }}</h4>
						<p>{{ topCommunity.numOfMembers }} members</p>
					</router-link>
				</div>
			</div>
		</div>

		<!-- pagination button to be added later -->
		<!-- <button>Load More</button> -->

	</div>
</template>

<script>
	import { db } from '@/firebase';
	import { collection, query, where, getDocs, addDoc, orderBy, startAfter, limit } from "firebase/firestore";

	export default {
		data() {
			return {
				lastVisibleDocument: '',
				posts: [],
				topCommunities: [],
			}
		},
		props: [
			'isUserLoggedIn',
			'loggedInUsername'
		],
		methods: {
			handleSearch() {
				// perform search
			},
			async like(postID) {
				const docSnapshot = await getDoc(doc(db, 'userPosts', postID));

			},
			dislike(postID) {

			},
		},
		async mounted() {
			// get random posts right now, but need to be ordered by trending most reecently
			this.posts = [];

			let q = query(collection(db, 'userPosts'), orderBy('postDate', 'desc'));
			let querySnapshot = await getDocs(q);
			querySnapshot.forEach(doc => {
				this.posts.push({
					id: doc.id,
					titleHTML: doc.data().titleHTML,
					contentHTML: doc.data().contentHTML,
					postDate: doc.data().postDate,
					authorUsername: doc.data().authorUsername,
					lastEdited: doc.data().lastEdited,
					likes: doc.data().likes,
					dislikes: doc.data().dislikes,
					community: doc.data().community,
				});
			});


			// get popular communities
			q = query(collection(db, 'communities'), orderBy('membersLength', 'desc'), limit(4));
			querySnapshot = await getDocs(q);
			querySnapshot.forEach(doc => {
				this.topCommunities.push({
					name: doc.data().name,
					numOfMembers: doc.data().membersLength,
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

	.sidebar {
		text-align: left;
	}

	.sidebar-content {
		padding: 10px;
		margin: 10px;
		max-width: 100%;
		position: sticky;
		top: 20%;
		border: 1px solid black;
	}

	.sidebar-links a {
		display: block;
		border: 1px solid black;
		padding: 20px;
	}

	.sidebar-popular-communities a {
		text-decoration: none;
		color: black;
	}

	.sidebar-popular-communities h4 {
		margin-bottom: -10px;
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
	}
</style>