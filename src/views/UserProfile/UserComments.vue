<template>
    <div id="posts-container">

        <!-- Display comments made by the logged-in user -->
    <div class="comments-container">
        <div v-for="comment in comments" :key="comment.key" class="comment">
            <div class="comment-metadata">
                <span class="comment-author">{{ comment.author }}</span> |
                <span class="comment-date">{{ comment.date }}</span>
            </div>
            <p v-html="comment.commentHTML" class="comment-content"></p>
            
            <router-link :to="{name: 'edit-comment', params: {commentID: comment.key, postID: comment.postID, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}"><button>Edit Comment</button></router-link>
            <button @click="deleteComment(comment.postID, comment.key)">Delete Comment</button>
            
		</div>
    </div>

    <!--PAGINATION load more button-->
		<div class="text-center">
		    <button type="button" class="btn btn-primary btn-sm" @click="loadMore()"> <span class="fa fa-arrow-down"></span> Load More </button> 
		</div>
      
    </div>
  </template>
  
  <script>
  import { QuillEditor } from '@vueup/vue-quill';
  import '@vueup/vue-quill/dist/vue-quill.snow.css';
  
  import { db } from '@/firebase';
  import { collectionGroup, query, where, getDocs, getDoc, orderBy, deleteDoc, doc, limit, startAfter } from "firebase/firestore";
  
  export default {
    data() {
      return {
        comments:[],
        lastComment: null,
      }
    },
    props: [
      'isUserLoggedIn',
      'loggedInUsername'
    ],
    methods: {
        async deleteComment(postID, commentID) {
            if (confirm('Do you want to delete the selected comment?') == true) {
                await deleteDoc(doc(db, 'userPosts', postID, 'comments', commentID));
                this.fetchComments();
                alert('The selected comment has been deleted');
            };
        },
        async fetchComments() {
                this.comments = [];
                
                // get comments
                let q = query(collectionGroup(db, 'comments'), where('author', '==', this.loggedInUsername), orderBy('date', 'desc'), limit(2));
                const commentsSnapshot = await getDocs(q);

                commentsSnapshot.forEach(doc => {
                    const commentData = {
                        key: doc.id,
                        postID: doc.data().postID || 'N/A',
                        author: doc.data().author,
                        commentHTML: doc.data().commentHTML,
                        date: doc.data().date,
                    };

                    this.comments.push(commentData);
                });
                // Pagination - Get the last visible document
                let lastComment = commentsSnapshot.docs[(commentsSnapshot.docs.length-1)];
                this.lastComment = lastComment;
            },
            async loadMore() {
                const nextBatchComments = [];

                if(this.lastComment == undefined){
                    return;
                }
                
                // get comments
                let q = query(collectionGroup(db, 'comments'), where('author', '==', this.loggedInUsername), orderBy('date', 'desc'), startAfter(this.lastComment), limit(2));
                const commentsSnapshot = await getDocs(q);

                commentsSnapshot.forEach(doc => {
                    const commentData = {
                        key: doc.id,
                        postID: doc.data().postID || 'N/A',
                        author: doc.data().author,
                        commentHTML: doc.data().commentHTML,
                        date: doc.data().date,
                    };

                    nextBatchComments.push(commentData);
                });

                this.comments.push(...nextBatchComments);

                //debugging
                console.log("nextBatchComments: ")
                for(const p of nextBatchComments){
                    console.log(p.commentHTML);
                }

                // Pagination - Get the last visible document
                let lastComment = commentsSnapshot.docs[(commentsSnapshot.docs.length-1)];
                this.lastComment = lastComment;
            }
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