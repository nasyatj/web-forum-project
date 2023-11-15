<template>
    <!-- need a search and dropdowns for sort by
    <form @submit.prevent="handleSearch">
		<input type="text" id="search-bar" placeholder="Search for posts, users, and communities..." />
		<button type="submit">Search</button>
	</form>
    -->

	<div id="posts-container">
		<div v-for="post in posts" :key="post.id" ref="postItems" class="post" :data-id="post.id">
			<router-link :to="{ name: 'post-details', params: { postID: post.id, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">
                <div class="post-metadata">
					<span class="post-author">{{ post.authorUsername }}</span> |
					<span class="post-date">{{ post.postDate }}</span>
                    <span class="post-flair" :style="{ backgroundColor: post.flair.color }">{{ post.flair.text }}</span>
                    <span class="post-last-edited-date" v-if="post.lastEdited != ''" >Last edited: {{ post.lastEdited }}</span>
                    <router-link class="post-community" :to="{ name: 'communities', params: { communityName: post.community, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">{{ post.community }}</router-link>
				</div>
				<h2 v-html="post.titleHTML" class="post-title"></h2>
				<p v-html="post.contentHTML" class="post-content"></p>
			</router-link>

            <router-link :to="{ name: 'edit-post', params: { postID: post.id, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}"><button>Edit Post</button></router-link>
            <button @click="deletePost(post.id)">Delete Post</button>
	    </div>
    </div>
</template>

<script>
    import { QuillEditor } from '@vueup/vue-quill';
    import '@vueup/vue-quill/dist/vue-quill.snow.css';

    import { db } from '@/firebase';
	import { collection, query, where, getDocs, getDoc, addDoc, orderBy, startAfter, limit, deleteDoc, doc } from "firebase/firestore";

    export default {
        data() {
            return {
                posts: [],
            }
        },
        props: [
            'isUserLoggedIn',
            'loggedInUsername'
        ],
        methods: {
            async deletePost(postID) {
                if (confirm('Do you want to delete the selected post?') == true) {
                    await deleteDoc(doc(db, 'userPosts', postID));
                    this.fetchUserPosts();
                    alert('The selected post has been deleted');
                };
            },
            async fetchUserPosts() {
                this.posts = [];

                let q = query(collection(db, 'userPosts'), where('authorUsername', '==', this.loggedInUsername), orderBy('postDate', 'desc'));
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
                        flair: doc.data().flair,
                        isLikedByCurrentUser: isLikedByCurrentUser,
                    });
                });
            }
        },
        async mounted() {
            await this.fetchUserPosts();
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

    .likes-count, .dislikes-count {
		margin-right: 5px;
	}

    .post-community {
		display: block;
		color: blue !important;
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