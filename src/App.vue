<template>
	<header>
		<h1>Web Forum</h1>
		<nav>
			<router-link to="/">Home</router-link>
			<router-link to="/sign-up" v-show="!isUserLoggedIn">Sign Up</router-link>
			<router-link to="/sign-in" v-show="!isUserLoggedIn">Sign In</router-link>

			<!-- Shown if user is logged in -->
			<span v-show="isUserLoggedIn">Welcome, {{ loggedInUsername }}!</span>
			<button v-show="isUserLoggedIn" @click="logout">Log Out</button>
			<router-link to="/user-profile/basic-info" v-show="isUserLoggedIn">Your Profile</router-link>

			<router-link to="/create-post" v-show="isUserLoggedIn">Create Post</router-link>
			<router-link to="/create-community" v-show="isUserLoggedIn">Create Community</router-link>

			<div v-show="isUserLoggedIn" class="user-communities">
				<span>Communities:</span>
				<select ref="communitySelector" @change="navigateToCommunity(communitySelection)" v-model="communitySelection">
					<option selected disabled value="">-- Select a community --</option>
					<optgroup label="Created Communities">
						<option v-for="createdCommunity in createdCommunities" :value="createdCommunity">{{ createdCommunity }}</option>
					</optgroup>
					<optgroup label="Joined Communities">
						<option v-for="joinedCommunity in joinedCommunities" :value="joinedCommunity">{{ joinedCommunity }}</option>
					</optgroup>
				</select>
			</div>
		</nav>
	</header>

	<!-- IMPORTANT: 'isUserLoggedIn' and 'loggedInUsername' props passed to any view that needs the logged in user info -->
	<!-- '@updateLoginStatus' responds to the 'updateLoginStatus' event emitted by SignUp and SignIn views 
		  indicating user has either signed up or logged in and to therefore replace 'Log In' and 'Sign Up' buttons
		  with 'Log Out' 
	-->
	<router-view 
		v-bind:isUserLoggedIn="isUserLoggedIn"
		v-bind:loggedInUsername="loggedInUsername"
		@updateLogInStatus="updateLogInStatus"
		@updateUsername="updateUsername"
	/>
</template>

<script>
	import { db } from '@/firebase';
	import { collection, query, where, getDocs, addDoc, orderBy, startAfter, limit, getDoc, doc, updateDoc } from "firebase/firestore";

	export default {
		data () {
			return {
				isUserLoggedIn: false,
				loggedInUsername: '',

				// used when user logged in 
				createdCommunities: [],
				joinedCommunities: [],
				communitySelection: '',
			}
		},
		methods: {
			updateLogInStatus(isUserLoggedIn, loggedInUsername) {
				this.isUserLoggedIn = isUserLoggedIn;
				this.loggedInUsername = loggedInUsername;
				this.fetchUsersCommunities();
				this.$refs.communitySelector.value='';
			},
			updateUsername(newUsername) {
				this.loggedInUsername = newUsername;
			},
			logout() {
				this.isUserLoggedIn = false;
				this.loggedInUsername = '';
				this.$router.push({ name: 'sign-in' });
				alert('You are now logged out');
				this.$refs.communitySelector.value='';
			},
			navigateToCommunity(communityName) {
				this.$router.push({ name: 'communities', params: { communityName: communityName, isUserLoggedIn: this.isUserLoggedIn, loggedInUsername: this.loggedInUsername }});
				this.$refs.communitySelector.value='';
			},
			async fetchUsersCommunities() {
				if (this.isUserLoggedIn == true) {
					this.createdCommunities = [];
					this.joinedCommunities = [];

					let q = query(collection(db, 'communities'), where('members', 'array-contains', this.loggedInUsername));
					let querySnapshot = await getDocs(q);
					querySnapshot.forEach(doc => {
						if (doc.data().creator == this.loggedInUsername)
							this.createdCommunities.push(doc.data().name);
						else if (doc.data().members.includes(this.loggedInUsername))
							this.joinedCommunities.push(doc.data().name);
					});
					this.createdCommunities.sort();
					this.joinedCommunities.sort();
				}
			}
		},
		async mount() {
			this.fetchUsersCommunities();
		}
	}
</script>

<style>
	#app {
		font-family: Avenir, Helvetica, Arial, sans-serif;
		text-align: center;
		color: #2c3e50;

		box-sizing: border-box;
		margin: 0;
		padding: 0;
		outline: none;
	}

	header {
		display: flex;
		border-bottom: 1px solid #42b983;
	}

	nav {
		display: flex;
		padding: 20px;
	}

	nav a, nav span, nav button {
		margin: 10px;
	}

	nav a {
		font-weight: bold;
		color: #2c3e50;
	}

	nav a.router-link-exact-active {
		color: #42b983;
	}

	/* quill editor toolbar */
	.ql-toolbar.ql-snow {
		text-align: left;
	}
</style>