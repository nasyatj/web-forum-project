<template>
    <!-- need to add a search bar to search within community and dropdowns to sort by various post properties like date, likes, etc. -->
    <div class="grid-container" v-show="doneLoading">
		<div class="main-content">
			<form class="search-bar" @submit.prevent="handleSearch">
				<input type="text" placeholder="Search for posts, users, and communities..." />
				<button type="submit">Search</button>
			</form>

			<h2 v-show="!isUserLoggedIn">Sign in to create posts and comment</h2>
			<router-link to="/create-post" v-show="isUserLoggedIn">Create Post</router-link>

			<div class="sort-by-container">
				<span>Sort by: </span>
				<select class="sort-by">
					<option value="top">Top</option>
					<option value="new">New</option>
					<option value="hot">Hot</option>
				</select>
			</div>

            <div v-show="!isCurrentUserCommunityCreator">
                <button v-show="!isCurrentUserPartOfCommunity" class="join-leave-edit-community" @click="joinCommunity">Join Community</button>
                <button v-show="isCurrentUserPartOfCommunity" class="join-leave-edit-community" @click="leaveCommunity">Leave Community</button>
            </div>

            <button v-show="isCurrentUserCommunityCreator" @click="editCommunity" class="join-leave-edit-community">Edit Community</button>

            <div id="posts-container">
                <div v-for="post in posts" :key="post.id" class="post" ref="posts">
                    <router-link class='post-link' :to="{ name: 'post-details', params: { postID: post.id, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">
                        <div class="post-metadata">
                            <span class="post-author">{{ post.authorUsername }}</span> |
                            <span class="post-date">{{ post.postDate }}</span>
                            <span class="post-flair" :style="{ backgroundColor: post.flair.color }">{{ post.flair.text }}</span>
                            <span class="post-last-edited-date" v-if="post.lastEdited != ''" >Last edited: {{ post.lastEdited }}</span>
                            <router-link class="post-community" :to="{ name: 'communities', params: { communityName: post.community, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">{{ post.community }}</router-link>
                        </div>
                        <h2 v-html="post.titleHTML" class="post-title"></h2>
                        <p v-html="post.contentHTML" class="post-content"></p>
                    </router-link>

                    <button class="like-button" @click="like(post.id, post.isLikedByCurrentUser)" v-show="isUserLoggedIn">Like</button>
                    <span class="likes-count">{{ post.likes.length }} likes</span>

                    <div class="pin-post">
                        <button @click="pinPost(post.id, post.isPinned)" v-show="isUserLoggedIn && isCurrentUserCommunityCreator">{{ post.isPinned ? 'Unpin' : 'Pin' }}</button>
                        <span v-show="post.isPinned">Pinned Icon Placeholder</span>
                    </div>
                </div>
            </div>
        </div>

        <Sidebar 
            :isUserLoggedIn="isUserLoggedIn"
            :loggedInUsername="loggedInUsername"
            :isCommunitySidebar="true"
            :communityName="communityName"
            :communityDescription="communityDescription"
            :communityGuidelines="guidelines"
            :communityModerators="moderators"
            :numOfMembers="numOfMembers"
        />
    </div>
</template>

<script>
    import { db } from '@/firebase';
	import { collection, query, where, getDocs, getDoc, addDoc, orderBy, startAfter, limit, deleteDoc, doc, updateDoc } from "firebase/firestore";

    import Sidebar from '@/components/Sidebar.vue';

    export default {
        data() {
            return {
                posts: [],

                // community info
                communityDescription: '',
                moderators: [],
                guidelines: [],
                creator: '',
                numOfMembers: 0,
                members: [],

                isCurrentUserPartOfCommunity: false,
                isCurrentUserCommunityCreator: false,

                // changes to true once all asynchronous request are finished in fetchPostsAndCommunityInfo function
                doneLoading: false,
            }
        },
        props: [
            'communityName',
            'isUserLoggedIn',
            'loggedInUsername'
        ],
        components: {
			Sidebar
		},
        watch: {
            async communityName(newName, oldName) {
                await this.fetchPostsAndCommunityInfo(newName);
            }
        },
        methods: {
            async pinPost(postID, isCurrentPostPinned) {
                let pinnedPostIndex = 0;
                let pinnedPost = {};

                this.posts.forEach((post, index) => {
					if (post.id == postID) {
                        post.isPinned = !isCurrentPostPinned;
                        pinnedPostIndex = index;
                        return;
                    }
				});

                //pinnedPost = this.posts.splice(pinnedPostIndex, 1);
                //console.log(pinnedPost);
                //this.posts = this.posts.filter(post => post.id != pinnedPost.id);

                function compare(a, b) {
                    if (a.isPinned == true && b.isPinned == false)
                        return -1;
                    if (a.isPinned == false && b.isPinned == true)
                        return 1;
                    return 0;
                }
                //this.posts.splice(0, 1, pinnedPost);
                this.posts.sort(compare);

                await updateDoc(doc(db, 'userPosts', postID), {
                    isPinned: !isCurrentPostPinned,
                });
            },
            async editCommunity() {
                
            },
            async joinCommunity() {
                if (this.isUserLoggedIn == false) {
                    alert('Please sign in to join this community');
                    return;
                }

                let q = query(collection(db, 'communities'), where('name', '==', this.communityName));
                let querySnapshot = await getDocs(q);
                let docID = querySnapshot.docs[0].id;
                let newMembers = querySnapshot.docs[0].data().members;
                newMembers.push(this.loggedInUsername);

                await updateDoc(doc(db, 'communities', docID), {
                    members: newMembers,
                    membersLength: newMembers.length,
                });

                alert('You have succesfully joined this community');

                // emit event to update parent App view's header's community selector
                this.$emit('updateCommunitiesSelector');

                this.isCurrentUserPartOfCommunity = true;
            },
            async leaveCommunity() {
                let q = query(collection(db, 'communities'), where('name', '==', this.communityName));
                let querySnapshot = await getDocs(q);
                let docID = querySnapshot.docs[0].id;
                let newMembers = querySnapshot.docs[0].data().members;
                newMembers = newMembers.filter(memberUsername => { return memberUsername != this.loggedInUsername; });

                await updateDoc(doc(db, 'communities', docID), {
                    members: newMembers,
                    membersLength: newMembers.length,
                });

                // emit event to update parent App view's header's community selector
                this.$emit('updateCommunitiesSelector');

                alert('You have succesfully left this community');

                this.isCurrentUserPartOfCommunity = false;
            },
            async like(postID, isLikedByCurrentUser) {
				let updatedLikes = [];

				this.posts.forEach((post, index) => {
					if (post.id == postID) {
						// unlike
						if (isLikedByCurrentUser == true)
							post.likes = post.likes.filter(username => { return username != this.loggedInUsername; });
						// like
						else 
							post.likes.push(this.loggedInUsername);

						updatedLikes = post.likes;
						post.isLikedByCurrentUser = !isLikedByCurrentUser;
					}
				});

				await updateDoc(doc(db, 'userPosts', postID), {
					likes: updatedLikes
				});
			},
            async fetchPostsAndCommunityInfo(communityName) {
                this.doneLoading = false;
                this.posts = [];

                // get posts
                let q = query(collection(db, 'userPosts'), where('community', '==', communityName), orderBy('postDate', 'desc'));
                let querySnapshot = await getDocs(q);

                querySnapshot.forEach(doc => {
                    let isLikedByCurrentUser = false;
                    if (this.isUserLoggedIn == true) {
                        doc.data().likes.forEach(likedByUsername => {
                            if (likedByUsername == this.loggedInUsername) {
                                isLikedByCurrentUser = true;
                                return;
                            }
                        });
                    }
                    this.posts.push({
                        id: doc.id,
                        titleHTML: doc.data().titleHTML,
                        contentHTML: doc.data().contentHTML,
                        postDate: doc.data().postDate.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                        authorUsername: doc.data().authorUsername,
                        lastEdited: doc.data().lastEdited != '' ? doc.data().lastEdited.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '',
                        likes: doc.data().likes,
                        dislikes: doc.data().dislikes,
                        community: doc.data().community,
                        flair: doc.data().flair,
                        isLikedByCurrentUser: isLikedByCurrentUser,
                        isPinned: doc.data().isPinned,
                    });

                    let pinnedPosts = this.posts.filter(post => post.isPinned == true);
                    console.log('pinnedPosts', pinnedPosts);
                    this.posts = this.posts.filter(post => !pinnedPosts.includes(post));
                    console.log(this.posts);
                    pinnedPosts.forEach(pinnedPost => {
                        this.posts.unshift(pinnedPost);
                    });
                });

                // get community information
                q = query(collection(db, 'communities'), where('name', '==', communityName));
                querySnapshot = await getDocs(q);

                this.communityDescription = querySnapshot.docs[0].data().description;
                this.moderators = querySnapshot.docs[0].data().moderators;
                this.guidelines = querySnapshot.docs[0].data().guidelines;
                this.creator = querySnapshot.docs[0].data().creator;
                this.numOfMembers = querySnapshot.docs[0].data().membersLength;
                this.members = querySnapshot.docs[0].data().members;
                if (this.isUserLoggedIn == true) {
                    this.isCurrentUserCommunityCreator = querySnapshot.docs[0].data().creator == this.loggedInUsername;
                    this.members.forEach(memberUsername => {
                        if (memberUsername == this.loggedInUsername) {
                            this.isCurrentUserPartOfCommunity = true;
                            return;
                        }
                    });
                }

                this.doneLoading = true;
            }
        },
        async mounted() {
            await this.fetchPostsAndCommunityInfo(this.communityName);
        }
    }
</script>

<style scoped>
    .join-leave-edit-community {
        padding: 10px 20px;
        margin: 20px 0px;
    }

    .grid-container {
		display: grid;
		max-width: 900px;
		grid-template-columns: 2fr 1fr;
		margin: auto;
	}

	.main-content {
		text-align: left;
	}

	form {
		margin: 20px;
	}

	form input {
		padding: 10px;
		width: 300px;
	}

	form button {
		margin: 10px;
		padding: 10px;
	}

	.post {
		border: 1px solid black;
		text-align: left;
		max-width: 600px;
		margin: 10px auto;
        position: relative;
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

	.post a {
		color: default;
		text-decoration: none;
		color: black;
	}

    .post button {
        padding: 10px;
        cursor: pointer;
        margin-right: 10px;
    }

    .post-last-edited-date {
        display: block;
    }

    .likes-count, .dislikes-count {
		margin-right: 5px;
	}

	.post-community {
		display: block;
		color: blue !important;
		margin-top: 10px;
		text-decoration: underline !important;
	}

    .post-flair {
		display: inline-block;
		margin: 5px 10px;
		padding: 5px 10px;
		border-radius: 20px;
	}

    .pin-post {
        position: absolute;
        top: 0px;
        right: 0px;
    }
</style>