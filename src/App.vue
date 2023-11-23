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
			
			<router-link v-if="showAutomodToolsButton" :to="`/communities/${communityName}/automod-tools`">Automod Tools</router-link>

			<div class="dropdown" v-show="isUserLoggedIn">
				<button class="notifications-button" @click="showNotifications">Notifications ({{ unreadNotificationsCount }})</button>
				<div class="dropdown-content hide" @blur="hideNotificationsOnBlur" ref="dropdownContent">
					<h3 v-if="notifications.length == 0">No new notifications</h3>
					<div v-for="notification in notifications">
						<div class="notification" v-if="notification.type == 'create-post'" @click="navigateFromNotification(notification.id, notification.type)">
							<h3>New post in {{ notification.community }}</h3>
							<span class="notification-date">{{ notification.postDate.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) }}</span>
							<h4>{{ notification.titlePlainText }}</h4>
							<p>{{ notification.contentPlainText.slice(0, 30) }}...</p>
							<button class="remove-notification-button" @click="removeNotification(notification.id, notification.type)">X</button>
						</div>
						<div class="notification" v-if="notification.type == 'create-comment'" @click="navigateFromNotification(notification.parentPostID, notification.type)">
							<h3>{{ notification.commentAuthor }} commented on your post</h3>
							<span class="notification-date">{{ notification.postDate }}</span>
							<p>{{ notification.commentPlainText }}</p>
							<button class="remove-notification-button" @click="removeNotification(notification.id, notification.type)">X</button>
						</div>
					</div>
				</div>
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

		@updateCommunitiesSelector="updateCommunitiesSelector"
		@notification="handleNotification"
	/>
</template>

<script>
	import { db } from '@/firebase';
import { tSThisType } from '@babel/types';
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
				notifications: [],
				unreadNotificationsCount: 0,
				notificationsShowing: false,
			}
		},
		methods: {
			async handleNotification(type, data) {
				if (type == 'create-post') {
					let q = query(collection(db, 'communities'), where('name', '==', data.community));
					let querySnapshot = await getDocs(q);
					let communityMembers = querySnapshot.docs[0].data().members;
					for (const memberUsername of communityMembers) {
						q = query(collection(db, 'users'), where('username', '==', memberUsername));
						querySnapshot = await getDocs(q);
						let userID = querySnapshot.docs[0].id;
						let newNotifications = querySnapshot.docs[0].data().notifications;
						newNotifications.push({
							type: type,
							read: false,
							...data,
						});
						await updateDoc(doc(db, 'users', userID), {
							notifications: newNotifications,
						});
					}
				}
				else if (type == 'create-comment') {
					let docSnapshot = await getDoc(doc(db, 'userPosts', data.parentPostID));
					let authorUsername = docSnapshot.data().authorUsername;
					let q = query(collection(db, 'users'), where('username', '==', authorUsername));
					let querySnapshot = await getDocs(q);
					let userID = querySnapshot.docs[0].id;
					let newNotifications = querySnapshot.docs[0].data().notifications;
					newNotifications.push({
						type: type,
						read: false,
						...data,
					});
					await updateDoc(doc(db, 'users', userID), {
						notifications: newNotifications,
					});
				}
			},
			updateLogInStatus(isUserLoggedIn, loggedInUsername) {
				this.isUserLoggedIn = isUserLoggedIn;
				this.loggedInUsername = loggedInUsername;

				this.fetchUsersCommunities();
				this.$refs.communitySelector.value='';
				
				this.fetchUserNotifications();
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
			updateCommunitiesSelector() {
				this.fetchUsersCommunities();
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
			},
			updateShowAutomodTools() {
                this.$forceUpdate();
  			},
			async showNotifications() {
				if (this.notificationsShowing == false) {
					this.$refs.dropdownContent.classList.remove('hide');
					this.$refs.dropdownContent.classList.add('show');
					this.$refs.dropdownContent.focus();
					this.notificationsShowing = true;

					this.notifications.forEach(notification => {
						if (notification.read == false)
							notification.read = true;
					});
					let q = query(collection(db, 'users'), where('username', '==', this.loggedInUsername));
					let querySnapshot = await getDocs(q);
					let userID = querySnapshot.docs[0].id;
					await updateDoc(doc(db, 'users', userID), {
						notifications: this.notifications,
					});
				}
				else
					this.hideNotificationsOnBlur();
			},
			async hideNotificationsOnBlur() {
				this.$refs.dropdownContent.classList.remove('show');
				this.$refs.dropdownContent.classList.add('hide');
				this.notificationsShowing = false;
			},
			async removeNotification(id, type) {
				this.notifications = this.notifications.filter(notification => notification.id != id && notification.type != type);
				let newNotifications = this.notifications.reverse();
				let q = query(collection(db, 'users'), where('username', '==', this.loggedInUsername));
				let querySnapshot = await getDocs(q);
				let userID = querySnapshot.docs[0].id;
				await updateDoc(doc(db, 'users', userID), {
					notifications: newNotifications,
				});

				await this.fetchUserNotifications();
			},
			async navigateFromNotification(id, type) {
				this.$router.push({ name: 'post-details', params: { postID: id, isUserLoggedIn: this.isUserLoggedIn, loggedInUsername: this.loggedInUsername }});
			},
			async fetchUserNotifications() {
				let q = query(collection(db, 'users'), where('username', '==', this.loggedInUsername));
				let querySnapshot = await getDocs(q);
				let notifications = querySnapshot.docs[0].data().notifications;
				notifications.reverse();
				this.notifications = notifications;
				let unreadNotificationsCount = 0;
				for (const notification of notifications) {
					console.log(notification);
					if (notification.read == false)
						unreadNotificationsCount++;
				}
				this.unreadNotificationsCount = unreadNotificationsCount;
			}
		},
		computed: {
    		showAutomodToolsButton() {
				return (
					this.isUserLoggedIn &&
					this.$route.params.communityName &&
					this.createdCommunities.includes(this.$route.params.communityName)
				);
    		},
  		},
		async mount() {
			this.fetchUsersCommunities();
			this.fetchUserNotifications();
		}
	}
</script>

<style>
	/* notifications */
	.dropdown {
		position: relative;
		text-align: left;
	}

	.dropdown-content {
		position: absolute;
		background-color: #f1f1f1;
		color: black;
		width: 400px;
		box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
		z-index: 10;
		padding: 10px;
	}

	.show {
		display: block;
	}

	.hide {
		display: none;
	}

	.notification {
		border-top: 1px solid rgba(0, 0, 0, 0.4);
		border-bottom: 1px solid rgba(0, 0, 0, 0.4);
		z-index: 11;
	}
	
	.notification:hover {
		cursor: pointer;
	}

	.remove-notification-button {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 12;
	}

	.notification-date {
		display: block;
		font-size: 12px;
		margin-top: -10px;
	}

	/* ------------- */

	/* loading spinner styles */
	.lds-dual-ring {
		display: inline-block;
		width: 40px;
		height: 40px;
		position: absolute;
		top: 50%;
	}
	.lds-dual-ring:after {
		content: " ";
		display: block;
		width: 32px;
		height: 32px;
		margin: 8px;
		border-radius: 50%;
		border: 2px solid #000;
		border-color: #000 transparent #000 transparent;
		animation: lds-dual-ring 1.2s linear infinite;
	}
	@keyframes lds-dual-ring {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	/* ---------------------- */

    #app {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        text-align: center;
        color: #008080; /* Teal Text */
        background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);  
	background-size: 400% 400%;
	animation: gradientBG 15s ease infinite;
	min-height: 100vh;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        outline: none;
    }
	@keyframes gradientBG {
	0% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0% 50%;
	}
}

    header {
        display: flex;
	padding-right: 20px; 
        border-bottom: 1px solid #FF7F50; /* Coral Border */
        background-color: #e73c7e;
        color: #000; /* black Text */
    }

	header h1 {
  	 font-size:35px;
	font-family: Baskerville, 'Baskerville Old Face', 'Hoefler Text', Garamond, 'Times New Roman', serif;
  	margin-left: 20px; /* Or as much as needed to move it to the right */
  
}

    nav {
        display: flex;
        padding: 20px;
    }

   h2 {
	font-size:30px;
	color: #000;
	font-family: Baskerville, 'Baskerville Old Face', 'Hoefler Text', Garamond, 'Times New Roman', serif;
	}

    nav a, nav span, nav button {
        margin: 10px;
        color: black;
    }

    nav a {
        font-weight: bold;
    }

    nav a.router-link-exact-active {
        color: #FF7F50; /* Coral for Active Link */
    }

    nav button {
        background-color: #FF7F50; /* Coral Background for Button */
        color: #FFFFFF; /* White Text */
        border: none;
        padding: 10px 15px;
        cursor: pointer;
    }

    nav button:hover {
        background-color: #E6735A; /* Darker Coral on Hover */
    }
</style>

