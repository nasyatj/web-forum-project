import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import SignUp from '../views/SignUp.vue';
import SignIn from '../views/SignIn.vue';

import UserProfile from '../views/UserProfile/UserProfile.vue';
import BasicInfo from '../views/UserProfile/BasicInfo.vue';
import ChangePassword from '../views/UserProfile/ChangePassword.vue';
import UserPosts from '../views/UserProfile/UserPosts.vue';``

import CreatePost from '../views/CreatePost.vue';

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
	{
		path: '/user-profile',
		name: 'user-profile',
		component: UserProfile,
		children: [
			{
				path: 'basic-info',
				name: 'basic-info',
				component: BasicInfo
			},
			{
				path: 'change-password',
				name: 'change-password',
				component: ChangePassword
			},
			{
				path: 'user-posts',
				name: 'user-posts',
				component: UserPosts
			},
		]
	},
	{
		path: '/create-post',
		name: 'create-post',
		component: CreatePost
	}
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
});

export default router;
