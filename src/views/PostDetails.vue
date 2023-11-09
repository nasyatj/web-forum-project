<template>
    <div class="grid-container">
        <div class="main-content">
            <div class="post">
                <div class="post-metadata">
                    <span class="post-author">{{ authorUsername }}</span> |
                    <span class="post-date">{{ postDate }}</span>
                    <span v-if="lastEdited != ''" class="post-last-edited-date">Last edited: {{ lastEdited }}</span>
                </div>
                <h2 v-html="titleHTML" class="post-title"></h2>
                <p v-html="contentHTML" class="post-content"></p>
            </div>

            <form @submit.prevent="handleAddComment" v-show="isUserLoggedIn">
                <h3>Add a comment:</h3>
                <QuillEditor v-model:content="commentHTML" content-type="html" required />
                <button type="submit">Post</button>
            </form>

            <div class="comments-container">
                <h2>Comments</h2>
                <div v-for="comment in comments" :key="comment.key" class="comment">
                    <div class="comment-metadata">
                        <span class="comment-author">{{ comment.author }}</span> |
                        <span class="comment-date">{{ comment.date }}</span>
                    </div>
                    <p v-html="comment.commentHTML" class="comment-content"></p>
                </div>
            </div>
        </div>

        <div class="sidebar">
            <div class="sidebar-content">
				<div class="sidebar-community-info">
                    <h3>{{ this.community }}</h3>
					<p>{{ this.communityDescription }}</p>
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

				<div class="sidebar-popular-communities">
					<h3>Popular Communities</h3>
					<router-link v-for="topCommunity in topCommunities" :to="{ name: 'communities', params: { communityName: topCommunity.name, isUserLoggedIn: this.isUserLoggedIn, loggedInUsername: this.loggedInUsername }}">
						<h4>{{ topCommunity.name }}</h4>
						<p>{{ topCommunity.numOfMembers }} members</p>
					</router-link>
				</div>
			</div>
        </div>
    </div>
</template>

<script>
    import { QuillEditor } from '@vueup/vue-quill';
    import '@vueup/vue-quill/dist/vue-quill.snow.css';

    import { db } from '@/firebase';
	import { doc, getDoc, collection, getDocs, addDoc, query, orderBy, where, limit } from "firebase/firestore";

    export default {
        data() {
            return {
                // post info
                titleHTML: '',
                contentHTML: '',
                postDate: '',
                authorUsername: '',
                commentHTML: '',
                lastEdited: '',
                comments: [],
                likes: [],
                dislikes: [],

                // community info
                community: '',
                communityDescription: '',
                communityGuidelines: [],
                communityModerators: [],
                numOfMembers: 0,
                topCommunities: [],
            }
        },
        props: [
            'postID',
            'isUserLoggedIn',
			'loggedInUsername'
        ],
        components: {
            QuillEditor
        },
        async mounted() {
            this.topCommunities = [];

            // get post info
            const docSnapshot = await getDoc(doc(db, 'userPosts', this.postID));
            this.titleHTML = docSnapshot.data().titleHTML;
            this.contentHTML = docSnapshot.data().contentHTML;
            this.postDate = docSnapshot.data().postDate;
            this.authorUsername = docSnapshot.data().authorUsername;
            this.lastEdited = docSnapshot.data().lastEdited;
            this.likes = docSnapshot.data().likes;
            this.dislikes=  docSnapshot.data().dislikes;
            this.community = docSnapshot.data().community;

            // get community info to render in sidebar
            let q = query(collection(db, 'communities'), where('name', '==', this.community));
            let communitySnapshot = await getDocs(q);
            this.communityDescription = communitySnapshot.docs[0].data().description;
            this.communityGuidelines = communitySnapshot.docs[0].data().guidelines;
            this.communityModerators = communitySnapshot.docs[0].data().moderators;
            this.numOfMembers = communitySnapshot.docs[0].data().membersLength;

            // get popular communities
            q = query(collection(db, 'communities'), orderBy('membersLength', 'desc'), limit(4));
            let querySnapshot = await getDocs(q);
            querySnapshot.forEach(doc => {
                this.topCommunities.push({
                    name: doc.data().name,
                    numOfMembers: doc.data().membersLength,
                });
            });

            await this.fetchComments();
        },
        methods: {
            async handleAddComment() {
                await addDoc(collection(db, 'userPosts', this.postID, 'comments'), {
                    author: this.loggedInUsername,
                    commentHTML: this.commentHTML,
                    date: new Date().toJSON().slice(0, 10),
                });
                this.fetchComments();
                alert('You have succesfully commented on this post');
            },
            async fetchComments() {
                this.comments = [];
                
                // get comments
                let q = query(collection(db, 'userPosts', this.postID, 'comments'), orderBy('date', 'desc'));
                const commentsSnapshot = await getDocs(q);

                commentsSnapshot.forEach(doc => {
                    this.comments.push({
                        key: doc.id,
                        author: doc.data().author,
                        commentHTML: doc.data().commentHTML,
                        date: doc.data().date,
                    });
                });
            }
        }
    }
</script>

<style scoped>
    .grid-container {
		display: grid;
		max-width: 900px;
		grid-template-columns: 2fr 1fr;
		margin: auto;
	}

	.main-content {
		text-align: left;
        margin-top: 30px;
	}

	.sidebar {
		text-align: left;
        position: relative;
	}

	.sidebar-content {
		padding: 10px;
		margin: 10px;
		max-width: 100%;
        position: absolute;
		top: 30px;
		border: 1px solid black;
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


    .post {
		border: 1px solid black;
		text-align: left;
		max-width: 600px;
		margin: 10px auto;
	}

	.post-metadata {
		font-size: 16px;
	}

	.post-title {
		margin-top: -15px;
		margin-bottom: -10px;
	}

	.post-content {
		margin-top: 30px;
	}

    .post-last-edited-date {
        display: block;
    }

    form {
        max-width: 900px;
        margin: auto;
    }

    form button {
        padding: 10px 20px;
        margin: 10px;
    }

    .comments-container {
        max-width: 600px;
        text-align: left;
        margin: auto;
    }

    .comment {
        text-align: left;
        margin-top: 30px;
        margin-bottom: 30px;
        margin-left: 15px;
    }

    .comment-metadata {
        font-weight: bold;
    }
</style>