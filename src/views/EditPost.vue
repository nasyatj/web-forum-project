<template>
    <h2>Edit Post</h2>

	<form action="#" @submit.prevent="">
        <h3>Title: </h3>
        <QuillEditor  :toolbar="['bold', 'italic']" v-model:content="title" content-type="html" ref="titleEditor" required />

        <h3>Content:</h3>
        <QuillEditor v-model:content="content" content-type="html" ref="contentEditor" required />

        <h4>Image Upload:</h4>
        <QuillEditor v-model:imgLink="imgLink" content-type="html" ref="imgBox" required />

        <div class="flair-selector" v-show="communityFlairs.length > 0">
            <h3>Flair:</h3>
            <span class="selected-flair" :style="{ backgroundColor: selectedFlair.color }">{{ selectedFlair.text ? selectedFlair.text : 'No flair selected' }}</span>
            <select class="select-flair" v-model="selectedFlair">
                <option :value="{}" class="select-flair-options">No flair</option>
                <option v-for="flair in communityFlairs" :value="{ text: flair.text, color: flair.color }" class="select-flair-options" :style="{backgroundColor: flair.color}">{{ flair.text }}</option>
            </select>
        </div>

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
                imgLink:'',
                communityFlairs: [],
                selectedFlair: {},
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
                    titlePlainText: this.$refs.titleEditor.getText(),
                    contentHTML: this.content,
                    imgLink: this.imgLink,
                    imgLinkPlain: this.$refs.imgBox.getText(),
                    contentPlainText: this.$refs.contentEditor.getText(),
                    lastEdited: new Date(),
                    flair: this.selectedFlair,
                });

                alert('Your post has been successfully updated');
                this.title = '';
                this.content = '';
                this.imgLink = '';
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
            this.imgLink = docSnapshot.data().imgLinkPlain;
            this.selectedFlair = docSnapshot.data().flair;

            let communityName = docSnapshot.data().community;
            let q = query(collection(db, 'communities'), where('name', '==', communityName));
            let querySnapshot = await getDocs(q);
            this.communityFlairs = querySnapshot.docs[0].data().flairs;
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

    .selected-flair {
		display: inline-block;
		margin: 5px 10px;
		padding: 5px 10px;
		border-radius: 20px;
	}
</style>