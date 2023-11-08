<template>
    <h2>Create a New Post</h2>

	<form @submit.prevent="handlePost">
        <h3>Title: </h3>
        <QuillEditor  :toolbar="['bold', 'italic']" v-model:content="title" content-type="html" required />

        <h3>Content:</h3>
        <QuillEditor v-model:content="content" content-type="html" required />

        <!-- need to get limited amount and dynamically search instead of dropdown with all communities later -->
        <h3>Community to post in:</h3>
        <select class="select-community" v-model="selectedCommunity" required>
            <option v-for="community in communities" :value="community.name" class="select-community-options">{{ community.name }}</option>
        </select>

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
                selectedCommunity: '',
                communities: [],
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
                    authorUsername: this.loggedInUsername,
                    lastEdited: '',
                    likes: [],
                    dislikes: [],
                    community: this.selectedCommunity,
				});

                alert('Your post has been successfully posted');
                this.title = '';
                this.content = '';
            }
        },
        async mounted() {
            let q = query(collection(db, 'communities'));
            let querySnapshot = await getDocs(q);

            querySnapshot.forEach(doc => {
                this.communities.push({
                    name: doc.data().name,
                });
            });

            // need to get limited amount and dynamically search instead of dropdown with all communities later
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

    .select-community {
        display: block;
    }
</style>