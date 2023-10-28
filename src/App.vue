<template>
	<header>
		<h1>Web Forum</h1>
		<nav>
			<router-link to="/">Home</router-link> |
			<router-link to="/sign-up">Sign Up</router-link> |
			<router-link to="/sign-in">Sign In</router-link>
		</nav>
	</header>
	
	<router-view />
</template>

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
		float: right;
		padding: 30px;
	}

	nav a {
		font-weight: bold;
		color: #2c3e50;
	}

	nav a.router-link-exact-active {
		color: #42b983;
	}
</style>
