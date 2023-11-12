<template>
    <div class="post">
        <div class="post-metadata">
            <span class="post-author">{{ authorUsername }}</span> |
            <span class="post-date">{{ postDate }}</span>
            <span v-if="lastEdited != ''" class="post-last-edited-date">Last edited: {{ lastEdited }}</span>
        </div>
		<h2 v-html="titleHTML" class="post-title"></h2>
        <p v-html="contentHTML" class="post-content"></p>
    </div>

    <form @submit.prevent="handleAddComment" v-show="isUserLoggedIn">
        <h3>Add a comment:</h3>
        <QuillEditor v-model:content="commentHTML" content-type="html" required />
        <button type="submit">Post</button>
	</form>

    <div class="comments-container">
        <h2>Comments</h2>
        <div v-for="comment in comments" :key="comment.key" class="comment">
            <div class="comment-metadata">
                <span class="comment-author">{{ comment.author }}</span> |
                <span class="comment-date">{{ comment.date }}</span>
            </div>
            <p v-html="comment.commentHTML" class="comment-content"></p>
		</div>
    </div>
</template>

<script>
    import { QuillEditor } from '@vueup/vue-quill';
    import '@vueup/vue-quill/dist/vue-quill.snow.css';

    import { db } from '@/firebase';
	import { doc, getDoc, collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";

    export default {
        data() {
            return {
                titleHTML: '',
                contentHTML: '',
                postDate: '',
                authorUsername: '',
                commentHTML: '',
                lastEdited: '',
                comments: [],
            }
        },
        props: [
            'postID',
            'isUserLoggedIn',
			'loggedInUsername'
        ],
        components: {
            QuillEditor
        },
        async mounted() {
            await this.fetchComments();
        },
        methods: {
            async handleAddComment() {
                await addDoc(collection(db, 'userPosts', this.postID, 'comments'), {
                    author: this.loggedInUsername,
                    commentHTML: this.commentHTML,
                    date: new Date().toJSON().slice(0, 10),
                });
                this.fetchComments();
                alert('You have succesfully commented on this post');
            },
            async fetchComments() {
                this.comments = [];

                const docSnapshot = await getDoc(doc(db, 'userPosts', this.postID));
                this.titleHTML = docSnapshot.data().titleHTML;
                this.contentHTML = docSnapshot.data().contentHTML;
                this.postDate = docSnapshot.data().postDate;
                this.authorUsername = docSnapshot.data().authorUsername;
                this.lastEdited = docSnapshot.data().lastEdited;

                const q = query(collection(db, 'userPosts', this.postID, 'comments'), orderBy('date', 'desc'));
                const commentsSnapshot = await getDocs(q);

                commentsSnapshot.forEach(doc => {
                    this.comments.push({
                        key: doc.id,
                        author: doc.data().author,
                        commentHTML: doc.data().commentHTML,
                        date: doc.data().date,
                    });
                });
            }
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

    .post-last-edited-date {
        display: block;
    }

    form {
        max-width: 900px;
        margin: auto;
    }

    form button {
        padding: 10px 20px;
        margin: 10px;
    }

    .comments-container {
        max-width: 600px;
        text-align: left;
        margin: auto;
        background-color: gainsboro;
        overflow-y: scroll;
    }

    .comment {
        text-align: left;
        margin-top: 30px;
        margin-bottom: 30px;
        margin-left: 15px;
    }

    .comment-metadata {
        font-weight: bold;
    }
</style>