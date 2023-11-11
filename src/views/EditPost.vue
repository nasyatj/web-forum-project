<template>
    <h2>Edit Post</h2>

	<form action="#" @submit.prevent="">
        <h3>Title: </h3>
        <QuillEditor  :toolbar="['bold', 'italic']" v-model:content="title" content-type="html" required />

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
                title: '',
                content: '',
			}
		},
        components: {
            QuillEditor
        },
		props: [
            'postID',
			'isUserLoggedIn',
			'loggedInUsername'
		],
        methods: {
            async handleSave() {
                await updateDoc(doc(db, 'userPosts', this.postID), {
                    titleHTML: this.title,
                    contentHTML: this.content,
                    lastEdited: new Date(),
                });

                alert('Your post has been successfully updated');
                this.title = '';
                this.content = '';

                this.navigateBack();
            },
            async navigateBack() {
                this.$router.push({ name: 'user-posts' });
            }
        },
        async mounted() {
            const docSnapshot = await getDoc(doc(db, 'userPosts', this.postID));
            this.title = docSnapshot.data().titleHTML;
            this.content = docSnapshot.data().contentHTML;
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