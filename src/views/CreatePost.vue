<template>
    <h2>Create a New Post</h2>

	<form @submit.prevent="handlePost">
        <h3>Title: </h3>
        <QuillEditor  :toolbar="['bold', 'italic']" v-model:content="title" content-type="html" ref="titleEditor" required />

        <h3>Content:</h3>
        <QuillEditor v-model:content="content" content-type="html" ref="contentEditor" required />

        <h3>Community to post in:</h3>
        <select class="select-community" v-model="selectedCommunity" required>
            <option v-for="community in communities" :value="community.name" class="select-community-options">{{ community.name }}</option>
        </select>

        <div class="flair-selector" v-show="communityFlairs.length > 0">
            <h3>Flair:</h3>
            <select class="select-flair" v-model="selectedFlair">
                <option v-for="flair in communityFlairs" :value="{ text: flair.text, color: flair.color }" class="select-flair-options" :style="{backgroundColor: flair.color}">{{ flair.text }}</option>
            </select>
        </div>

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
                communityFlairs: [],
                selectedFlair: {},
			}
		},
        components: {
            QuillEditor
        },
		props: [
			'isUserLoggedIn',
			'loggedInUsername'
		],
        watch: {
            async selectedCommunity(newVal, oldVal) {
                let q = query(collection(db, 'communities'), where('name', '==', newVal));
                let querySnapshot = await getDocs(q);
                this.communityFlairs = querySnapshot.docs[0].data().flairs;
                this.selectedFlair = {};
            }
        },
        methods: {
            async handlePost() {
                let currentDate = new Date();

				let addedPost = await addDoc(collection(db, "userPosts"), {
					titleHTML: this.title,
                    titlePlainText: this.$refs.titleEditor.getText(),
                    contentHTML: this.content,
                    contentPlainText: this.$refs.contentEditor.getText(),
                    postDate: currentDate,
                    authorUsername: this.loggedInUsername,
                    lastEdited: '',
                    likes: [],
                    dislikes: [],
                    community: this.selectedCommunity,
                    flair: this.selectedFlair,
                    isPinned: false,
				});

                // emit notification
                this.$emit('notification', 'create-post', {
                    id: addedPost.id,
                    titlePlainText: this.$refs.titleEditor.getText(),
                    contentPlainText: this.$refs.contentEditor.getText(),
                    postDate: currentDate,
                    community: this.selectedCommunity,
                });

                alert('Your post has been successfully posted');
                this.title = '';
                this.content = '';

                this.$router.push({ name: 'home'});
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