<template>
	<h2>Sign in to your account</h2>

	<form @submit.prevent="handleSubmit">
		<label>Username or Email:</label>
		<input type="text" required v-model="usernameOrEmail">

		<label>Password:</label>
		<input type="password" required v-model="password">

		<button type="submit">Login</button>
	</form>
</template>

<script>
	import { db } from '@/firebase';
	import { collection, query, where, getDocs, or, and } from "firebase/firestore"; 

	export default {
		data() {
			return {
				usernameOrEmail: '',
				password: '',
			}
		},
		methods: {
			async handleSubmit() {
				const usersTable = collection(db, "users");
				let q = query(usersTable, or(and(where('username', '==', this.usernameOrEmail), where('password', '==', this.password)), 
				                             and(where('email', '==', this.usernameOrEmail), where('password', '==', this.password))));
				let querySnapshot = await getDocs(q);

				if (querySnapshot.size == 0) {
					alert('Username or password is incorrect');
					return;
				}

				alert('You are now logged in!');

				// https://stackoverflow.com/questions/42091805/add-event-listener-to-router-link-component-using-v-on-directive-vuejs
				// global variables vue
			}
		}
	};
</script>

<style scoped>
	form label, form input {
		display: block;
	}

	form input {
		margin: 0 auto 20px auto;
	}

	form label {
		margin: 0 auto 10px auto;
	}

	button {
		padding: 10px;
		margin: 10px;
	}
</style>