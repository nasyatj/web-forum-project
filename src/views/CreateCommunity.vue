<template>
    <h2>Create a New Community</h2>

	<form action="#" @submit.prevent="">
        <h3>Community Name: </h3>
        <input type="text" v-model="name" required />

        <h3>Community Description:</h3>
        <input type="text" v-model="description" required />

        <!-- Guidelines -->
        <div class="guidelines-input-container">
            <h3>Guidelines</h3>
            <input type="text" placeholder="Guideline heading" v-model="guidelineHeading" />
            <input type="text" placeholder="Guideline description" v-model="guidelineDescription" />
            <button @click="addGuideline">Add Guideline</button>
        </div>

        <div class="guidelines-container">
            <div v-for="guideline in guidelines">
                <h4>{{ guideline.heading }}</h4>
                <p> {{ guideline.description }}</p>
                <button @click="removeGuideline(guideline.heading)">Remove</button>
            </div>
        </div>

        <!-- Users to add as moderators (default is user themself) -->

        <!-- Flairs -->
        <div class="flairs-input-container">
            <h3>Flairs</h3>
            <input type="text" placeholder="Enter a flair name to add" v-model="flairTextInput"/>
            <label>Flair color: </label>
            <input type="color" id="flair-color-input" placeholder="Choose a flair color" v-model="flairColorInput" />
            <button @click="addFlair">Add</button>
        </div>

        <div class="flairs-container">
            <div v-for="flair in flairs">
                <span class="flair" :style="{ backgroundColor: flair.color }">{{ flair.text }}</span>
                <button @click="removeFlair(flair.text, flair.color)">Remove</button>
            </div>
        </div>

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

                flairTextInput: '',
                flairColorInput: '#ff0000',
                flairs: [],

                guidelineHeading: '',
                guidelineDescription: '',
                guidelines: [],
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
            addFlair() {
                if (this.flairTextInput < 3) {
                    alert('Please enter a flair text greater than 3 characters');
                    return;
                }
                if (this.flairs.length > 0) {
                    if (this.flairs.find(flair => flair.text == this.flairTextInput)) {
                        alert('A flair already exists with that name');
                        return;
                    }
                    else if (this.flairs.find(flair => flair.color == this.flairColorInput)) {
                        alert('A flair already exists with that color');
                        return;
                    }
                }

                this.flairs.push({
                    text: this.flairTextInput,
                    color: this.flairColorInput,
                });

                this.flairTextInput = '';
                this.flairColorInput = '';
            },
            removeFlair(text, color) {
                this.flairs = this.flairs.filter(flair => flair.text != text && flair.color != color);
            },
            addGuideline() {
                if (this.guidelineHeading == '' || this.guidelineDescription == '') {
                    alert('Guideline heading and description can not be blank');
                    return;
                }
                if (this.guidelines.length > 0) {
                    if (this.guidelines.find(guideline => guideline.heading == this.guidelineHeading)) {
                        alert('A guideline already exists with that heading');
                        return;
                    }
                }

                this.guidelines.push({
                    heading: this.guidelineHeading,
                    description: this.guidelineDescription,
                });

                this.guidelineHeading = '';
                this.guidelineDescription = '';
            },
            removeGuideline(heading) {
                this.guidelines = this.guidelines.filter(guideline => guideline.heading != heading);
            },
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
                    guidelines: this.guidelines,
                    flairs: this.flairs,
                    creator: this.loggedInUsername,
                    members: [this.loggedInUsername],
                    membersLength: 1,  // always update this value when adding or removing users from members list 
                                       // firebase doest not let you query on array sizes, which is why this field was created
				});

                alert('Your community has been succesfully created');
                this.title = '';
                this.content = '';

                // emit event to update parent App view's header's community selector
                this.$emit('updateCommunitiesCommunities');

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
		margin: 5px 5px 0px 0px;
		padding: 10px 30px;
	}

    .flairs-input-container button, .flairs-container button, .guidelines-input-container button, .guidelines-container button {
        padding: 5px;
        width: default;
    }

    #flair-color-input {
        display: inline-block;
        width: 50px;
        height: 25px;
        padding: 1px;
    }

    .flair {
        color: black;
        padding: 10px;
        border-radius: 20px;
    }
</style>