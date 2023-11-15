<template>
    <div id="posts-container">

        <!-- Display comments made by the logged-in user -->
    <div class="comments-container">
        <div v-for="comment in comments" :key="comment.key" class="comment">
            <!--<router-link :to="{ name: 'post-details', params: { postID: post.id, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}"> -->
                <div class="comment-metadata">
                    <span class="comment-author">{{ comment.author }}</span> |
                    <span class="comment-date">{{ comment.date }}</span>
                </div>
                <p v-html="comment.commentHTML" class="comment-content"></p>
            <!--</router-link> -->

            <router-link :to="{name: 'edit-comment', params: { postID: post.id, commentID: comment.id, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">
                <button>Edit Comment</button>>
            </router-link>
            <button @click="deleteComment(comment.id)">Delete Comment</button>
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
        comments:[],
      }
    },
    props: [
      'isUserLoggedIn',
      'loggedInUsername'
    ],
    methods: {
        async deleteComment(commentID) {
            if (confirm('Do you want to delete the selected comment?') == true) {
                await deleteDoc(doc(db, 'userPosts', this.postID, 'comments', commentID));
                this.fetchComments();
                alert('The selected comment has been deleted');
            };
        },
      async fetchComments() {
                this.comments = [];
                
                // Fetch all posts
                const postsSnapshot = await getDocs(collection(db, 'userPosts'));

                // Iterate through each post and fetch comments
                for (const postDoc of postsSnapshot.docs) {
                    const postID = postDoc.id;
                    
                    // Query comments for each post
                    const q = query(collection(db, 'userPosts', postID, 'comments'), where('author', '==', this.loggedInUsername), orderBy('date', 'desc'));
                        const commentsSnapshot = await getDocs(q);
                        commentsSnapshot.forEach(doc => {
                        this.comments.push({
                            id: doc.id,
                            author: doc.data().author,
                            commentHTML: doc.data().commentHTML,
                            date: doc.data().date,
                        });
                    });                   
                }
      },
    },
    async mounted() {
            await this.fetchComments();
        }
  }
  </script>
  
<style scoped>
    .comments-container {
        max-width: 600px;
        text-align: left;
        margin: auto;
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
  