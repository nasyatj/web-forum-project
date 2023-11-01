<template>
	<h2>Home Page</h2>
	<p>Is User Logged In: {{ isUserLoggedIn }}</p>
	<p>Username: {{ loggedInUsername }}</p>
</template>

<script>
	export default {
		props: [
			'isUserLoggedIn',
			'loggedInUsername'
		]
	}
</script>

<style>
	
</style>