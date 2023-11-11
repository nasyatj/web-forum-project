<template>
    <form @submit.prevent="updateUsername">
        <label>Current Username: {{ loggedInUsername }}</label>

		<label>New Username:</label>
		<input type="text" v-model="newUsername" required>

        <button type="submit">Update Username</button>
    </form>

    <br>

    <form @submit.prevent="updateEmail">
        <label>Current Email: {{ currentEmail }}</label>

		<label>New Email:</label>
		<input type="email" v-model="newEmail" required>

        <label>Confirm New Email:</label>
        <input type="email" v-model="confirmNewEmail" required>

		<button type="submit">Update Email</button>
	</form>

    <br>

    <form @submit.prevent="updateProfilePhoto">
        <input type="file" ref="profile-photo" accept='image/*' required>
        <button type="submit">Update Photo</button>
    </form>
</template>

<script>
    import { db } from '@/firebase';
	import { collection, query, where, getDocs, or, and, doc, updateDoc } from "firebase/firestore"; 

	export default {
        data() {
            return {
                newUsername: '',
                newEmail: '',
                confirmNewEmail: '',
                currentEmail: '',
            }
        },
		props: [
			'loggedInUsername'
		],
        methods: {
            async updateUsername() {
                const usersTable = collection(db, "users");
				let q = query(usersTable, where('username', '==', this.newUsername));
				let querySnapshot = await getDocs(q);

				if (querySnapshot.size > 0) {
					alert('A user already exists with that username');
					return;
				}

                q = query(usersTable, where('username', '==', this.loggedInUsername));
                querySnapshot = await getDocs(q);
                let docID = '';
                querySnapshot.forEach(doc => {
                    docID = doc.id;
                });

                await updateDoc(doc(db, 'users', docID), {
                    username: this.newUsername
                });

                this.$emit('updateUsername', this.newUsername);
                alert('Your username has been updated');
                this.newUsername = '';
            },
            async updateEmail() {
                if (this.newEmail != this.confirmNewEmail) {
                    alert('Emails do not match');
                    return;
                }

                const usersTable = collection(db, "users");
				let q = query(usersTable, where('email', '==', this.newEmail));
				let querySnapshot = await getDocs(q);

				if (querySnapshot.size > 0) {
					alert('An account already exists with that email address');
					return;
				}

                q = query(usersTable, where('email', '==', this.currentEmail));
                querySnapshot = await getDocs(q);
                let docID = '';
                querySnapshot.forEach(doc => {
                    docID = doc.id;
                });

                await updateDoc(doc(db, 'users', docID), {
                    email: this.newEmail
                });

                this.currentEmail = this.newEmail;

                alert('Your email has been updated');
                this.newEmail = '';
                this.confirmNewEmail = '';
            }
        },
        async mounted() {
            const usersTable = collection(db, "users");
			let q = query(usersTable, where('username', '==', this.loggedInUsername)); 
			let querySnapshot = await getDocs(q);

            // only one doc will be returned as username is unique
            querySnapshot.forEach(doc => {
                this.currentEmail = doc.data().email;
            });
        }
	}
</script>

<style scoped>
    form label, form input, form button {
        display: block;
        margin: 20px auto 20px auto;
    }

    form button {
        padding: 10px 20px;
    }
</style>