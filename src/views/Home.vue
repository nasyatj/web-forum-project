<template>
	<form @submit.prevent="handleSearch">
		<input type="text" id="search-bar" placeholder="Search for posts, users, and communities..." />
		<button type="submit">Search</button>
	</form>
	
	<h2 v-show="!isUserLoggedIn">Sign in to create posts and comment</h2>
	<router-link to="/create-post" v-show="isUserLoggedIn">Create Post</router-link>

	<div id="posts-container">
		<div v-for="post in posts" :key="post.id" class="post" ref="posts">
			<router-link :to="{ name: 'post-details', params: { postID: post.id, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">
				<div class="post-metadata">
					<span class="post-author">{{ post.authorUsername }}</span> |
					<span class="post-date">{{ post.postDate }}</span>
					<span v-if="post.lastEdited != ''" class="post-last-edited-date">Last edited: {{ post.lastEdited }}</span>
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

	<!-- pagination button to be added later -->
	<!-- <button>Load More</button> -->
</template>

<script>
	import { db } from '@/firebase';
	import { collection, query, where, getDocs, addDoc, orderBy, startAfter, limit } from "firebase/firestore";

	export default {
		data() {
			return {
				lastVisibleDocument: '',
				posts: [],
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
				});
			});

			// pagination to be added later: https://firebase.google.com/docs/firestore/query-data/query-cursors
		}
	}
</script>

<style scoped>
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
</style>