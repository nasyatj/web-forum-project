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
				let temp = [];
				querySnapshot.forEach(doc => {
					console.log(doc.id, '=>', doc.data());
					temp.push(doc.id);
				});

				if (temp.length > 0) {
					alert('A user already exists with that username');
					return;
				}

				q = query(usersTable, where('email', '==', this.email));
				querySnapshot = await getDocs(q);
				temp = [];
				querySnapshot.forEach(doc => {
					console.log(doc.id, '=>', doc.data());
					temp.push(doc.id);
				});

				if (temp.length > 0) {
					alert('A user already has registered with that email. Please navigate to the log-in page if that account belongs to you');
					return;
				}

				await addDoc(collection(db, "users"), {
					email: this.email,
					password: this.password,
					username: this.username
				});

				alert('Your account has been created!');

				// https://stackoverflow.com/questions/42091805/add-event-listener-to-router-link-component-using-v-on-directive-vuejs
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
