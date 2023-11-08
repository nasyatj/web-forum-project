<template>
    <!-- need to add a search bar to search within community and dropdowns to sort by various post properties like date, likes, etc. -->
    
    <h2 v-html="communityName"></h2>
    <p v-html="communityDescription"></p>

    <button id="join-community">Join Community</button>

	<div id="posts-container">
		<div v-for="post in posts" :key="post.id" ref="postItems" class="post" :data-id="post.id">
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
    </div>
</template>

<script>
    import { db } from '@/firebase';
	import { collection, query, where, getDocs, getDoc, addDoc, orderBy, startAfter, limit, deleteDoc, doc } from "firebase/firestore";

    export default {
        data() {
            return {
                posts: [],
                communityDescription: '',
                moderators: [],
                guidelines: [],
                creator: '',
            }
        },
        props: [
            'communityName',
            'isUserLoggedIn',
            'loggedInUsername'
        ],
        methods: {
            // note: need to add which communitty post belongs to to all posts
            // add sidebar containing community it belongs to
            // add join button and in database, add communities under userposts to denote what communities they are a part of


        },
        async mounted() {
            this.posts = [];

            // get posts
            let q = query(collection(db, 'userPosts'), where('community', '==', this.communityName), orderBy('postDate', 'desc'));
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

            // get community information
            q = query(collection(db, 'communities'), where('name', '==', this.communityName));
            querySnapshot = await getDocs(q);

            this.communityDescription = querySnapshot.docs[0].data().description;
            this.moderators = querySnapshot.docs[0].data().moderators;
            this.guidelines = querySnapshot.docs[0].data().guidelines;
            this.creator = querySnapshot.docs[0].data().creator;
        }

    }
</script>

<style scoped>
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

    .post button {
        padding: 10px;
        cursor: pointer;
        margin-right: 10px;
    }

    .post-last-edited-date {
        display: block;
    }
</style>