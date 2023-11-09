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
                    <span v-if="post.lastEdited != ''" class="post-last-edited-date">Last edited: {{ post.lastEdited }}</span>
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
    // need cookies to store login state, add time to dates, make post and sidebar components, like/dislike posts, make all posts part of communities
    // search component, rediio interface (sidebar to the right, search on top), homepage (trending posts if not logged in, most recent posts if logged in on top )
    // add images to post, user profile pictures
    
    // https://framework7.io/vue/introduction
    // https://vuetifyjs.com/en/components/navigation-drawers/#location

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
                    this.posts.push({
                        id: doc.id,
                        titleHTML: doc.data().titleHTML,
                        contentHTML: doc.data().contentHTML,
                        postDate: doc.data().postDate,
                        authorUsername: doc.data().authorUsername,
                        lastEdited: doc.data().lastEdited
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
</style>