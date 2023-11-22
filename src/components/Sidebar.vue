<template>
    <div class="sidebar">
        <div class="sidebar-content" :class="{ sticky: !isCommunitySidebar}">
            <div class="sidebar-community-info">
                <h3>{{ isCommunitySidebar == true ? communityName : 'Home' }}</h3>
                <p>{{ isCommunitySidebar == true ? communityDescription : 'Your personal page showing latest posts from communities you have joined and the latest trending posts' }}</p>
            </div>

            <div class="sidebar-links">
                <div v-show="!isUserLoggedIn">
                    <router-link to="/sign-up" v-show="!isUserLoggedIn">Sign Up</router-link>
                    <router-link to="/sign-in" v-show="!isUserLoggedIn">Sign In</router-link>
                </div>
                <div v-show="isUserLoggedIn">
                    <router-link to="/create-post" v-show="isUserLoggedIn">Create Post</router-link>
                    <router-link to="/create-community" v-show="isUserLoggedIn">Create Community</router-link>
                </div>
            </div>

            <div class="community-info" v-show="isCommunitySidebar">
                <h3>Community Info</h3>
                <div class="guidelines-container">
                    <div class="guideline" v-for="guideline in communityGuidelines">
                        <h4>{{ guideline.heading }}</h4>
                        <p>{{ guideline.description }}</p>
                    </div>
                </div>
                <h4>Flairs: </h4>
                <div class="flairs-container">
                    <span class="flair" v-for="flair in communityFlairs" :style="{ backgroundColor: flair.color }">{{ flair.text }}</span>
                </div>
            </div>

            <div class="sidebar-popular-communities">
                <h3>Popular Communities</h3>
                <router-link v-for="topCommunity in topCommunities" :to="{ name: 'communities', params: { communityName: topCommunity.name, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">
                    <h4>{{ topCommunity.name }}</h4>
                    <p>{{ topCommunity.numOfMembers }} members</p>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
    import { db } from '@/firebase';
	import { collection, query, where, getDocs, addDoc, orderBy, startAfter, limit } from "firebase/firestore";

    export default {
        data() {
            return {
                topCommunities: [],
            }
        },
        props: [
            'isUserLoggedIn',
            'loggedInUsername',

            // community info
            'isCommunitySidebar',
            'communityName',
            'communityDescription',
            'communityGuidelines',
            'communityFlairs',
            'communityModerators',
            'numOfMembers'
        ],
        async mounted() {
            this.topCommunities = [];

            let q = query(collection(db, 'communities'), orderBy('membersLength', 'desc'), limit(4));
			let querySnapshot = await getDocs(q);
			querySnapshot.forEach(doc => {
				this.topCommunities.push({
					name: doc.data().name,
					numOfMembers: doc.data().membersLength,
				});
			});
        }
    }
</script>

<style scoped>
    .sidebar {
		text-align: left;
	}

	.sidebar-content {
		padding: 10px;
		margin: 10px;
		max-width: 100%;
		border: 1px solid black;
	}

    .sticky {
        position: sticky;
		top: 20%;
    }

	.sidebar-links a {
		display: block;
		border: 1px solid black;
		padding: 20px;
	}

	.sidebar-popular-communities a {
		text-decoration: none;
		color: black;
	}

	.sidebar-popular-communities h4 {
		margin-bottom: -10px;
	}

    .flairs-container {
        display: flex;
        flex-direction: column;
    }

    .flair {
        margin: 5px 10px;
		padding: 5px 10px;
		border-radius: 20px;
    }
</style>