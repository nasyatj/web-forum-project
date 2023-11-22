<template>
	<h2>Edit your user profile</h2>

    <nav>
        <router-link to="/user-profile/basic-info">Basic Info</router-link>
		<router-link to="/user-profile/change-password">Password</router-link>
		<router-link to="/user-profile/user-posts">Posts</router-link>
        <router-link to="/user-profile/user-comments">Comments</router-link>
        <router-link to="/user-profile/user-bookmarks">Bookmarks</router-link>
    </nav>

    <router-view 
        v-bind:isUserLoggedIn="isUserLoggedIn"
        v-bind:loggedInUsername="loggedInUsername"
        @updateUsername="updateParentWithNewUsername"
    />
</template>

<script>
    export default {
        data() {
            return {

            }
        },
        props: [
            'isUserLoggedIn',
            'loggedInUsername'
        ],
        methods: {
            updateParentWithNewUsername(newUsername) {
                this.$emit('updateUsername', newUsername);
            }
        }
    }
</script>

<style scoped>
	nav {
        display: inline-block;
        margin: 20px auto 20px auto;
    }
</style>