<template>
    <!-- need a search and dropdowns for sort by
    <form @submit.prevent="handleSearch">
		<input type="text" id="search-bar" placeholder="Search for posts, users, and communities..." />
		<button type="submit">Search</button>
	</form>
    -->

    <div class="sort-by-container">
        <span>Sort by: </span>
        <select class="sort-by" v-model="sortBySelect">
            <option value="new" selected>New</option>
            <option value="top">Top</option>
        </select>
    </div>

	<div id="posts-container" v-show="doneLoading">
		<div v-for="post in posts" :key="post.id" class="post">
			<router-link :to="{ name: 'post-details', params: { postID: post.id, isUserLoggedIn: isUserLoggedIn, loggedInUsername: loggedInUsername }}">
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

            <button class="like-button" @click="like(post.id, post.isLikedByCurrentUser)" v-show="isUserLoggedIn">{{ post.isLikedByCurrentUser ? 'Unlike' : 'Like' }}</button>
			<span class="likes-count">{{ post.likes.length }} likes</span>

            <button class="bookmark-button" @click="bookmark(post.id, post.isBookmarkedByCurrentUser)" v-show="isUserLoggedIn">{{ post.isBookmarkedByCurrentUser ? 'Unbookmark' : 'Bookmark' }}</button>
        </div>

        <h4 v-show="posts.length == 0">No bookmarks created yet</h4>
    </div>

	<!--PAGINATION load more button-->
	<div class="text-center">
		<button type="button" class="btn btn-primary btn-sm" @click="loadMore()"> <span class="fa fa-arrow-down"></span> Load More </button> 
	</div>

    <!-- Spinner -->
	<div class="lds-dual-ring" v-show="!doneLoading">Loading...</div>
</template>

<script>
    import { QuillEditor } from '@vueup/vue-quill';
    import '@vueup/vue-quill/dist/vue-quill.snow.css';

    import { db } from '@/firebase';
	import { collection, query, where, getDocs, getDoc, addDoc, orderBy, startAfter, limit, deleteDoc, doc, updateDoc } from "firebase/firestore";

    export default {
        data() {
            return {
                posts: [],
				lastPost: null,
                doneLoading: false,
                sortBySelect: 'new',
            }
        },
        props: [
            'isUserLoggedIn',
            'loggedInUsername'
        ],
        watch: {
			sortBySelect(newVal, oldVal) {
				if (newVal == 'new') {
					function compare(a, b) {
						if (a.postDateTimestamp.seconds > b.postDateTimestamp.seconds)
							return -1;
						else if (a.postDateTimestamp.seconds < b.postDateTimestamp.seconds)
							return 1;
						else
							return 0;
					}
					this.posts.sort(compare);
				}
				else if (newVal == 'top') {
					function compare(a, b) {
						if (a.likes.length > b.likes.length)
							return -1;
						else if (a.likes.length < b.likes.length)
							return 1;
						else
							return 0;
					}
					this.posts.sort(compare);
				}
			}
		},
        methods: {
            editPost(postID) {
                this.$router.push({ name: 'edit-post', params: { postID: postID, isUserLoggedIn: this.isUserLoggedIn, loggedInUsername: this.loggedInUsername }});
            },
            async deletePost(postID) {
                if (confirm('Do you want to delete the selected post?') == true) {
                    await deleteDoc(doc(db, 'userPosts', postID));
                    this.fetchUserPosts(null);
                    alert('The selected post has been deleted');
                };
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
            async bookmark(postID, isBookmarkedByCurrentUser) {
				this.posts.forEach(post => {
					if (post.id == postID)
						post.isBookmarkedByCurrentUser = !isBookmarkedByCurrentUser;
				});

				let q = query(collection(db, 'users'), where('username', '==', this.loggedInUsername));
				let querySnapshot = await getDocs(q);
				let userID = querySnapshot.docs[0].id;
				let updatedBookmarks = querySnapshot.docs[0].data().bookmarks;

				// un-bookmark
				if (isBookmarkedByCurrentUser == true)
					updatedBookmarks = updatedBookmarks.filter(bookmarkPostID => bookmarkPostID != postID);
				// bookmark
				else
					updatedBookmarks.push(postID);

				await updateDoc(doc(db, 'users', userID), {
					bookmarks: updatedBookmarks,
				});
			},
            async fetchUserPosts() {
                this.doneLoading = true;

                this.posts = [];

                let q = query(collection(db, 'userPosts'), orderBy('postDate', 'desc'), limit(4));
                let querySnapshot = await getDocs(q);

                for (const doc of querySnapshot.docs) {
                    // find out if post liked by current logged in user
                    let isLikedByCurrentUser = false;
                    if (this.isUserLoggedIn == true) {
                        doc.data().likes.forEach(likedByUsername => {
                            if (likedByUsername == this.loggedInUsername) {
                                isLikedByCurrentUser = true;
                                return;
                            }
                        });
                    }

                    // find out if post bookmarked by current logged in user
                    let isBookmarkedByCurrentUser = false;
                    if (this.isUserLoggedIn == true) {
                        let temp = await getDocs(query(collection(db, 'users'), where('username', '==', this.loggedInUsername), where('bookmarks', 'array-contains', doc.id)));
                        if (temp.docs.length > 0)
                            isBookmarkedByCurrentUser = true;
                    }
                    
                    if (isBookmarkedByCurrentUser == true) {
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
                            isBookmarkedByCurrentUser: isBookmarkedByCurrentUser,
                            postDateTimestamp: doc.data().postDate,
                        });
                    }
                }

				// Pagination - Get the last visible document
				let lastPost = querySnapshot.docs[(querySnapshot.docs.length-1)];
				this.lastPost = lastPost;

                this.doneLoading = true;
            },
			async loadMore() {

                const nextBatchPosts = [];

                let q = query(collection(db, 'userPosts'), orderBy('postDate', 'desc'), startAfter(this.lastPost),limit(2));
                let querySnapshot = await getDocs(q);

                for (const doc of querySnapshot.docs) {
                    // find out if post liked by current logged in user
                    let isLikedByCurrentUser = false;
                    if (this.isUserLoggedIn == true) {
                        doc.data().likes.forEach(likedByUsername => {
                            if (likedByUsername == this.loggedInUsername) {
                                isLikedByCurrentUser = true;
                                return;
                            }
                        });
                    }

                    // find out if post bookmarked by current logged in user
                    let isBookmarkedByCurrentUser = false;
                    if (this.isUserLoggedIn == true) {
                        let temp = await getDocs(query(collection(db, 'users'), where('username', '==', this.loggedInUsername), where('bookmarks', 'array-contains', doc.id)));
                        if (temp.docs.length > 0)
                            isBookmarkedByCurrentUser = true;
                    }
                    
                    if (isBookmarkedByCurrentUser == true) {
                        nextBatchPosts.push({
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
                            isBookmarkedByCurrentUser: isBookmarkedByCurrentUser,
                            postDateTimestamp: doc.data().postDate,
                        });
                    }
                }

				this.posts.push(...nextBatchPosts);
            }
        },
        async mounted() {
            await this.fetchUserPosts();
        }
    }
</script>

<style scoped>
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
</style>