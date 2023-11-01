<template>
    <h2>Change Password</h2>

    <form @submit.prevent="updatePassword">
		<label>Current Password:</label>
		<input type="password" v-model="currentPassword" required>

        <label>New Password:</label>
		<input type="password" v-model="newPassword" required>

        <label>Confirm New Password:</label>
		<input type="password" v-model="confirmNewPassword" required>

        <button type="submit">Update Password</button>
    </form>
</template>

<script>
    import { db } from '@/firebase';
	import { collection, query, where, getDocs, or, and, doc, updateDoc } from "firebase/firestore"; 


    export default {
        data() {
            return {
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: '',
            }
        },
        props: [
            'loggedInUsername'
        ],
        methods: {
            async updatePassword() {
                const usersTable = collection(db, "users");
				let q = query(usersTable, where('username', '==', this.loggedInUsername));
				let querySnapshot = await getDocs(q);
                let userPasswordFromDb = '';
                let docID = '';

				querySnapshot.forEach(doc => {
                    userPasswordFromDb = doc.data().password;
                    docID = doc.id;
                });

                if (this.currentPassword != userPasswordFromDb) {
                    alert('Current password is incorrect');
                    return;
                }

                if (this.newPassword != this.confirmNewPassword) {
                    alert('New password and Confirm new password fields do not match');
                    return;
                }

                await updateDoc(doc(db, 'users', docID), {
                    password: this.newPassword
                });

                alert('Your password has been updated');
                this.currentPassword = '';
                this.newPassword = '',
                this.confirmNewPasswordPassword = '';
            }
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