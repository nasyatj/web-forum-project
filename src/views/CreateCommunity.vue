<template>
    <h2>Create a New Community</h2>

	<form action="#" @submit.prevent="">
        <h3>Community Name: </h3>
        <input type="text" v-model="name" required />

        <h3>Community Description:</h3>
        <input type="text" v-model="description" required />

        <!-- Guidelines -->

        <!-- Users to add as moderators (default is user themself)-->

        <button @click="createCommunity">Create Community</button>
        <button @click="cancel">Cancel</button>
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
                name: '',
                description: '',
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
            async createCommunity() {
                // check community doesn't already exist
                let q = query(collection(db, 'communities'), where('name', '==', this.name));
                let querySnapshot = await getDocs(q);

                if (querySnapshot.size > 0) {
                    alert('A community already exists with that name');
                    return;
                }

                // create community
				await addDoc(collection(db, 'communities'), {
					name: this.name,
                    description: this.description,
                    moderators: [this.loggedInUsername],
                    guidelines: [],
                    creator: this.loggedInUsername,
                    members: [this.loggedInUsername],
                    membersLength: 1,  // always update this value when adding or removing users from members list 
                                       // firebase doest not let you query on array sizes, which is why this field was created
				});

                alert('Your community has been succesfully created');
                this.title = '';
                this.content = '';

                // navigate to community
                this.$router.push({ name: 'communities', params: { communityName: this.name, isUserLoggedIn: this.isUserLoggedIn, loggedInUsername: this.loggedInUsername }});
            },
            cancel() {
                this.$router.push({ name: 'home' });
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
        display: block;
		padding: 10px;
		width: 300px;
	}

	form button {
		margin: 10px;
		padding: 10px 30px;
	}
</style>