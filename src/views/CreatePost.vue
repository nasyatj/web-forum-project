<template>
    <h2>Create a New Post</h2>

	<form @submit.prevent="handlePost">
        <h3>Title: </h3>
        <QuillEditor  :toolbar="['bold', 'italic']" v-model:content="title" content-type="html" required />
        
        <h3>Community:</h3>
        <input v-model="targetCommunity" content-type="text" required/>
        <h3>Content:</h3>
        <QuillEditor v-model:content="content" content-type="html" required />


        <!-- placeholder for later
        <label for="target-community">In which of your communities would you like to post this?</label>
        <select name="target-community">
            <option value="default">General Home Page (default)</option>
        </select>
        -->

        <button type="submit">Post</button>
	</form>
</template>

<script>
    import { QuillEditor } from '@vueup/vue-quill';
    import '@vueup/vue-quill/dist/vue-quill.snow.css';

    import { db } from '@/firebase';
	import { collection, query, where, getDocs, addDoc } from "firebase/firestore";


	export default {
		data() {
			return {
                title: '',
                content: '',
                targetCommunity: '',
			}
		},
        components: {
            QuillEditor
        },
		props: [
			'isUserLoggedIn',
			'loggedInUsername'
		],
        methods: {
            async handlePost() {
				await addDoc(collection(db, "userPosts"), {
					titleHTML: this.title,
                    contentHTML: this.content,
                    postDate: new Date().toJSON().slice(0, 10),
                    community: this.targetCommunity,
                    authorUsername: this.loggedInUsername
				});

                alert('Your post has been successfully posted');
                this.title = '';
                this.content = '';
                this.targetCommunity = '';
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