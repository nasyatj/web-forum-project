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
	/>
</template>

<script>
	export default {
		data () {
			return {
				isUserLoggedIn: false,
				loggedInUsername: ''
			}
		},
		methods: {
			updateLogInStatus(isUserLoggedIn, loggedInUsername) {
				this.isUserLoggedIn = isUserLoggedIn;
				this.loggedInUsername = loggedInUsername;
			},
			logout() {
				this.isUserLoggedIn = false;
				this.loggedInUsername = '';
				this.$router.push({ name: 'sign-in' });
				alert('You are now logged out');
			}
		}
	}
</script>

<style>
	#app {
		font-family: Avenir, Helvetica, Arial, sans-serif;
		text-align: center;
		color: #2c3e50;

		box-sizing: border-box;
		margin: 0;
		padding: 0;
		outline: none;
	}

	header {
		display: flex;
		border-bottom: 1px solid #42b983;
	}

	nav {
		display: flex;
		padding: 20px;
	}

	nav a, nav span, nav button {
		margin: 10px;
	}

	nav a {
		font-weight: bold;
		color: #2c3e50;
	}

	nav a.router-link-exact-active {
		color: #42b983;
	}
</style>