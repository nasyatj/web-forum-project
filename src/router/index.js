import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import SignUp from '../views/SignUp.vue';
import SignIn from '../views/SignIn.vue';

const routes = [
	{
		path: '/',
		name: 'home',
		component: Home
	},
	{
		path: '/sign-up',
		name: 'sign-up',
		component: SignUp
	},
	{
		path: '/sign-in',
		name: 'sign-in',
		component: SignIn
	},
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
});

export default router;
