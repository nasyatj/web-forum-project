
<template>
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
  
        <!-- Display comments for the logged-in user only -->
        <div v-if="isUserLoggedIn">
          <h2>Comments</h2>
          <div v-for="comment in filteredComments(post.fetchComments())" :key="comment.key" class="comment">
            <div class="comment-metadata">
                <span class="comment-author">{{ comment.author }}</span> |
                <span class="comment-date">{{ comment.date }}</span>
            </div>
            <p v-html="comment.commentHTML" class="comment-content"></p>
          </div>
        </div>
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
                title: '',
                content: '',
                comments: [],
            }
        },
        props: [
            'postID',
            'commentID',
            'isUserLoggedIn',
            'loggedInUsername'
        ],
        methods: {
            async deleteComment(commentID) {
                if (confirm('Do you want to delete the selected Comment?') == true) {
                    await deleteDoc(doc(db, 'userPosts', commentID));
                    this.fetchComments();
                    alert('The selected comment has been deleted');
                };
            },
            async filteredComments(comments) {
                return comments.filter(comment => comment.author === this.loggedInUsername);
            },
             async fetchComments() {
                    this.comments = [];

                    const docSnapshot = await getDoc(doc(db, 'userPosts', this.postID));
                    this.titleHTML = docSnapshot.data().titleHTML;
                    this.contentHTML = docSnapshot.data().contentHTML;
                    this.postDate = docSnapshot.data().postDate;
                    this.authorUsername = docSnapshot.data().authorUsername;
                    this.lastEdited = docSnapshot.data().lastEdited;

                    const q = query(collection(db, 'userPosts'), where('authorUsername', '==', this.loggedInUsername), orderBy('postDate', 'desc'));
                    const commentsSnapshot = await getDocs(q);

                    commentsSnapshot.forEach(doc => {
                        this.comments.push({
                            key: doc.id,
                            author: doc.data().author,
                            commentHTML: doc.data().commentHTML,
                            date: doc.data().date,
                        });
                    });
                },    
            async mounted() {
                await this.fetchComments();
                const docSnapshot = await getDoc(doc(db, 'userPosts', this.postID));
                this.title = docSnapshot.data().titleHTML;
                this.content = docSnapshot.data().contentHTML;
            },
            async handleSave() {
                    await updateDoc(doc(db, 'userPosts', this.postID, 'comments'), {
                        author: this.loggedInUsername,
                        commentHTML: this.commentHTML,
                        lastEdited: new Date().toJSON().slice(0, 10),
                    });

                    alert('Your comment has been successfully updated');
                    this.title = '';
                    this.content = '';

                    this.navigateBack();
            },
            async navigateBack() {
                this.$router.push({ name: 'user-posts' });
            },
        },
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