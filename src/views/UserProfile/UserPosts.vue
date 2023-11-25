<template>
    <form @submit.prevent="handleSearch">
        <input v-model="searchTerm" type="text" id="search-bar" placeholder="Search for posts..." />
        <button @click="search">Search</button>
        <button @click="clearSearch">Clear</button>
    </form>

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
				<p class="image-box"><img :src="post.imgLinkPlain" width="400" /></p>
			</router-link>

            <button class="like-button" @click="like(post.id, post.isLikedByCurrentUser)" v-show="isUserLoggedIn">{{ post.isLikedByCurrentUser ? 'Unlike' : 'Like' }}</button>
			<span class="likes-count">{{ post.likes.length }} likes</span>

            <button @click="editPost(post.id)">Edit Post</button>
            <button @click="deletePost(post.id)">Delete Post</button>

            <button class="bookmark-button" @click="bookmark(post.id, post.isBookmarkedByCurrentUser)" v-show="isUserLoggedIn">{{ post.isBookmarkedByCurrentUser ? 'Unbookmark' : 'Bookmark' }}</button>
        </div>

        <!--PAGINATION load more button-->
		<div class="text-center">
		    <button type="button" class="btn btn-primary btn-sm" @click="loadMore()"> <span class="fa fa-arrow-down"></span> Load More </button> 
		</div>

        <h4 v-show="posts.length == 0 && isSearchResults == true">No posts found with those terms</h4>
        <h4 v-show="posts.length == 0 && filterBookmarksChecked == false && isSearchResults == false">No posts created yet</h4>
        <h4 v-show="posts.length == 0 && filterBookmarksChecked == true  && isSearchResults == false">No bookmarks created yet</h4>
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
                filterBookmarksChecked: false,
                doneLoading: false,
                sortBySelect: 'new',
                searchTerm: '',
				isSearchResults: false,
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
            async search() {
				if (this.searchTerm.length < 3) {
					alert('Atleast 3 characters required for search');
					return;
				}
				this.isSearchResults = true;

				await this.fetchUserPosts();
				this.doneLoading = false;

				// search posts
				let postHits = [];
				for (const post of this.posts) {
					if (post.titlePlainText.toLowerCase().includes(this.searchTerm.toLowerCase()) || post.contentPlainText.toLowerCase().includes(this.searchTerm.toLowerCase())) {
						postHits.push(post);
					}
				}

				this.posts = postHits;

				this.doneLoading = true;
			},
			async clearSearch() {
				this.isSearchResults = false;
				await this.fetchUserPosts();
			},
            async fetchUserPosts() {
                this.doneLoading = false;

                this.posts = [];

                let q = query(collection(db, 'userPosts'), where('authorUsername', '==', this.loggedInUsername), orderBy('postDate', 'desc'), limit(4));
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
                    
                    this.posts.push({
                        id: doc.id,
                        titleHTML: doc.data().titleHTML,
                        titlePlainText: doc.data().titlePlainText,
                        contentHTML: doc.data().contentHTML,
                        contentPlainText: doc.data().contentPlainText,
						imgLinkPlain: doc.data().imgLinkPlain,
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

                // Pagination - Get the last visible document
				let lastPost = querySnapshot.docs[(querySnapshot.docs.length-1)];
				this.lastPost = lastPost;

                this.doneLoading = true;
            },
            async loadMore() {
                const nextBatchPosts = [];

                if(this.lastPost == undefined){
                    return;
                }

                let q = query(collection(db, 'userPosts'), where('authorUsername', '==', this.loggedInUsername), orderBy('postDate', 'desc'), startAfter(this.lastPost), limit(2));
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
                    
                    nextBatchPosts.push({
                        id: doc.id,
                        titleHTML: doc.data().titleHTML,
                        titlePlainText: doc.data().titlePlainText,
                        contentHTML: doc.data().contentHTML,
                        contentPlainText: doc.data().contentPlainText,
						imgLinkPlain: doc.data().imgLinkPlain,
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

                this.posts.push(...nextBatchPosts);

                // Pagination - Get the last visible document
				let lastPost = querySnapshot.docs[(querySnapshot.docs.length-1)];
				this.lastPost = lastPost;
            }
        },
        async mounted() {
            await this.fetchUserPosts();
        }
    }
</script>

<style scoped>
	.post {
		border: 4px solid black;
		border-radius: 10px;
		background-color: white;
		text-align: left;
		max-width: 600px;
		margin: 10px auto;
	}

	.post-metadata {
		font-size: 16px;
	}

	.post-title {
		padding-left: 5px;
		margin-top: -15px;
		margin-bottom: -10px;
	}

	.image-box{
        display: block;
        margin-left: auto;
        margin-right: auto;
        width: 65%;
    }

	.post-content {
	color: #000; 
	padding-left: 30px;
        font-weight: bold;	
	margin-top: 30px;
	}

	.post a {
		color: default;
		text-decoration: none;
		color: black;
	}

    .post button {
         padding: 5px 10px;
    cursor: pointer;
    margin-right: 10px;
    border: none;
    border-radius: 5px;
    background-color: #23d5ab;
    color: white;
    text-transform: uppercase;
    font-weight: bold;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
    outline: none; 
    }

	.post button:hover {
    background-color: #0056b3;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.post button.like-button {
    background-color: #23a6d5;
}

.post button.like-button:hover {
    background-color: #218838;
}

.post button.bookmark-button {
    background-color: #e73c7e;
}

.post button.bookmark-button:hover {
    background-color: #e0a800;
}

.post button.delete-button {
    background-color: #ee7752;
}

.post button.delete-button:hover {
    background-color: #c82333;
}  

	.post .button-container {
    position: absolute;
    bottom: 10px; /* Adjust this value to move the buttons up from the bottom */
    left: 0;
    right: 0;
    text-align: center; /* This will center the buttons */
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
