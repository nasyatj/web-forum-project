<template>
    <h2>Edit Comment</h2>

	<form action="#" @submit.prevent="">

        <h3>Content:</h3>
        <QuillEditor v-model:content="content" content-type="html" ref="contentEditor" required />

        <button @click="handleSave">Save</button>
        <button @click="navigateBack">Cancel</button>
	</form>
</template>

<script>
    import { QuillEditor } from '@vueup/vue-quill';
    import '@vueup/vue-quill/dist/vue-quill.snow.css';

    import { db } from '@/firebase';
	import {getDoc, doc, updateDoc } from "firebase/firestore";


	export default {
		data() {
			return {
                content: '',

			}
		},
        components: {
            QuillEditor
        },
		props: [
            'commentID',
            'postID',
			'isUserLoggedIn',
			'loggedInUsername'
		],
        methods: {
            async handleSave() {
                console.log('handleSave - postID:', this.postID);
                console.log('handleSave - commentID:', this.commentID);

                await updateDoc(doc(db, 'userPosts', this.postID, 'comments', this.commentID), {
                    commentHTML: this.content,
                    date: new Date().toJSON().slice(0, 10),
                });

                alert('Your comment has been successfully updated');
                this.title = '';
                this.content = '';

                this.navigateBack();
            },
            async navigateBack() {
                this.$router.push({ name: 'user-comments' });
            }
        },
        async mounted() {

            const docSnapshot = await getDoc(doc(db, 'userPosts', this.postID, 'comments', this.commentID));
            this.content = docSnapshot.data().commentHTML;
            console.log('mounted - content:', this.content);
        }
	}
</script>

<style scoped>
	form {
		margin: 20px auto;
        max-width: 900px;
        text-align: left;
	}

	form input {
		padding: 10px;
		width: 300px;
	}

	form button {
		margin: 10px;
		padding: 10px 30px;
	}
</style>