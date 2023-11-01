<template>
	<h2>Edit your user profile</h2>

    <nav>
        <router-link to="/user-profile/basic-info">Basic Info</router-link>
		<router-link to="/user-profile/change-password">Password</router-link>
		<router-link to="/user-profile/user-posts">Posts</router-link>
    </nav>

    <router-view 
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