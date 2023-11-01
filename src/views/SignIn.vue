<template>
	<h2>Sign in to your account</h2>

	<form @submit.prevent="handleSubmit">
		<label>Username:</label>
		<input type="text" required v-model="username">

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
				username: '',
				password: '',
			}
		},
		methods: {
			async handleSubmit() {
				const usersTable = collection(db, "users");
				let q = query(usersTable, and(where('username', '==', this.username), where('password', '==', this.password))); 
				let querySnapshot = await getDocs(q);

				if (querySnapshot.size == 0) {
					alert('Username or password is incorrect');
					return;
				}

				alert('You are now logged in!');

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