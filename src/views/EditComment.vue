<template>
    <h2>Edit Comment</h2>

	<form action="#" @submit.prevent="">

        <h3>Content:</h3>
        <QuillEditor v-model:content="content" content-type="html" required />

        <button @click="handleSave">Save</button>
        <button @click="navigateBack">Cancel</button>
	</form>
</template>

<script>
    import { QuillEditor } from '@vueup/vue-quill';
    import '@vueup/vue-quill/dist/vue-quill.snow.css';

    import { db } from '@/firebase';
	import { collection, query, where, getDocs, addDoc, getDoc, doc, updateDoc } from "firebase/firestore";


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
            'postID',
            'commentID',
			'isUserLoggedIn',
			'loggedInUsername'
		],
        methods: {
            async handleSave() {
                await updateDoc(doc(db, 'userPosts', this.postID, this.commentID), {
                    commentHTML: this.content,
                    date: new Date(),
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
            const postId = this.postID;
            const commentId = this.commentID;

            const postDocSnapshot = await getDoc(doc(db, 'userPosts', postId));
            const specificComment = postDocSnapshot?.data()?.comments?.[commentId];

            if (specificComment) {
                this.content = docSnapshot.data().commentHTML;
            }
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