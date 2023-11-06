<template>
	<form @submit.prevent="handleSearch">
		<input type="text" id="search-bar" placeholder="Search for posts, users, and communities..." />
		<button type="submit">Search</button>
	</form>
	
	<h2 v-show="!isUserLoggedIn">Sign in to create posts and comment</h2>
	<router-link to="/create-post" v-show="isUserLoggedIn">Create Post</router-link>

	<div id="posts-container">
		<div v-for="post in posts" :key="post.id" class="post">
			<router-link :to="{ name: 'post-details', params: { postID: post.id, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">
				<div class="post-metadata">
					<span class="post-author">{{ post.authorUsername }}</span> |
					<span class="post-date">{{ post.postDate }}</span>
					<span v-if="post.lastEdited != ''" class="post-last-edited-date">Last edited: {{ post.lastEdited }}</span>
				</div>
				<h2 v-html="post.titleHTML" class="post-title"></h2>
				<p v-html="post.contentHTML" class="post-content"></p>
			</router-link>
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

			let q = query(collection(db, 'userPosts'), orderBy('postDate', 'desc'));
			let querySnapshot = await getDocs(q);

			querySnapshot.forEach(doc => {
				this.posts.push({
					id: doc.id,
					titleHTML: doc.data().titleHTML,
					contentHTML: doc.data().contentHTML,
					postDate: doc.data().postDate,
					authorUsername: doc.data().authorUsername,
					lastEdited: doc.data().lastEdited
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
</style>