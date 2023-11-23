<template>
	<h2>Create your account</h2>

	<form @submit.prevent="handleSubmit">
		<label>Email:</label>
		<input type="email" required v-model="email">

		<label>Username:</label>
		<input type="text" required v-model="username">

		<label>Password:</label>
		<input type="password" required v-model="password">

		<label>Confirm Password:</label>
		<input type="password" required v-model="confirmPassword">

		<button type="submit">Submit</button>
	</form>
</template>

<script>
	import { db } from '@/firebase';
	import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

	export default {
		data() {
			return {
				email: '',
				username: '',
				password: '',
				confirmPassword: '',
			}
		},
		methods: {
			async handleSubmit() {
				if (this.password != this.confirmPassword) {
					alert('Passwords do not match, please try again');
					return;
				}

				const usersTable = collection(db, "users");
				let q = query(usersTable, where('username', '==', this.username));
				let querySnapshot = await getDocs(q);

				if (querySnapshot.size > 0) {
					alert('A user already exists with that username');
					return;
				}

				q = query(usersTable, where('email', '==', this.email));
				querySnapshot = await getDocs(q);

				if (querySnapshot.size > 0) {
					alert('A user already has registered with that email. Please navigate to the log-in page if that account belongs to you');
					return;
				}

				await addDoc(collection(db, "users"), {
					email: this.email,
					password: this.password,
					username: this.username,
					bookmarks: [],
					notifications: [],
				});

				alert('Your account has been created!');

				// https://www.danvega.dev/blog/2019/06/05/triggering-events-router-vue/
				// global variables vue, or use vuex store

				this.$emit('updateLogInStatus', true, this.username);

				this.$router.push({ name: 'home' });
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
		padding: 10px 20px;
		margin: 10px;
	}
</style>