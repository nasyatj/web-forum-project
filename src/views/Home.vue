<template>
	<form @submit.prevent="handleSearch">
		<input type="text" id="search-bar" placeholder="Search for posts, users, and communities..." />
		<button type="submit">Search</button>
	</form>
	
	<h2 v-show="!isUserLoggedIn">Sign in to create posts and comment</h2>
	<router-link to="/create-post" v-show="isUserLoggedIn">Create Post</router-link>

	<div id="posts-container">
		<div v-for="post in posts" :key="post.authorUsername" class="post">
			<h2 v-html="post.titleHTML" class="post-title"></h2>
			<div class="post-metadata">
				<span class="post-author">Author: {{ post.authorUsername }}</span> |
				<span class="post-date">Created on {{ post.postDate }}</span>
			</div>
			<p v-html="post.contentHTML" class="post-content"></p>

			<!-- add router-link to post details later (to details about post such as comments, etc.) -->
		</div>
		<!-- pagination button to be added later
		<button>Load More</button>
		-->
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
		},
		async mounted() {
			this.posts = [];

			let q = query(collection(db, 'userPosts'), orderBy('postDate'));
			let querySnapshot = await getDocs(q);

			querySnapshot.forEach(doc => {
				this.posts.push({
					titleHTML: doc.data().titleHTML,
					contentHTML: doc.data().contentHTML,
					postDate: doc.data().postDate,
					authorUsername: doc.data().authorUsername
				});
			});

			console.log(querySnapshot.size);

			/* pagination to be added later 
			// get first page of documents
			const first = query(collection(db, 'userPosts'), orderBy('postDate'), limit(5));
			const documentSnapshots = await getDocs(first);

			// get the last visible document
			const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];

			// construct a new query starting at this document
			// get the next 5 posts
			const next = query(collection(db, 'userPosts'), orderBy('postDate'), limit(5), startAfter(lastVisible));
			*/
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

	.posts-container {
		
	}

	.post {
		border: 1px solid rgba(0, 0, 0, 0.4);
		text-align: left;
		padding: 20px;
		max-width: 600px;
		margin: auto;
	}

	.post-metadata {
		font-size: 12px;
	}

	.post-title {
		margin-top: -15px;
		margin-bottom: -10px;
	}

	.post-content {
		margin-top: 30px;
	}
</style>