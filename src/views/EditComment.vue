<template>
    <div class="comment">
      <div class="comment-metadata">
        <span class="comment-author">{{ comment.author }}</span> |
        <span class="comment-date">{{ comment.date }}</span>
      </div>
      <div v-if="!editing">
        <p v-html="comment.commentHTML" class="comment-content"></p>
        <button @click="startEditing">Edit</button>
      </div>
      <div v-else>
        <QuillEditor v-model="editedCommentHTML" content-type="html" required />
        <button @click="saveEdit">Save</button>
        <button @click="cancelEdit">Cancel</button>
      </div>
    </div>
  </template>
  
  <script>
        import { QuillEditor } from '@vueup/vue-quill';
        import '@vueup/vue-quill/dist/vue-quill.snow.css';
        
        import { db } from '@/firebase';
        import { doc, updateDoc } from "firebase/firestore";
        
        export default {
            props: [
                'postId', 
                'comment'
            ],
            
            data() {
            return {
                editing: false,
                editedCommentHTML: this.comment.commentHTML,
            };
            },
            methods: {
            startEditing() {
                this.editing = true;
            },
            async saveEdit() {
                try {
                    // Check if the logged-in user is the author of the comment
                    if (this.comment.author === this.loggedInUsername) {
                    await updateDoc(doc(db, 'userPosts', this.postId, 'comments', this.comment.key), {
                        commentHTML: this.editedCommentHTML,
                    });

                    // Refresh comments after saving edit
                    this.$emit('comment-edited');
                    this.editing = false;
                    } else {
                    alert('You can only edit your own comments.');
                    }
                } catch (error) {
                    console.error('Error updating comment:', error);
                    alert('Error updating comment. Please try again.');
                }
            },

            cancelEdit() {
                this.editing = false;
                this.editedCommentHTML = this.comment.commentHTML;
            },
            },
        };
  </script>