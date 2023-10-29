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
	import { collection, query, where, getDocs } from "firebase/firestore"; 

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
				const querySnapshot = await getDocs(q);
				querySnapshot.forEach(doc => {
					console.log('document');
					console.log(doc.id, '=>', doc.data());
				});

				q = query(usersTable, where('email', '==', this.email));

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