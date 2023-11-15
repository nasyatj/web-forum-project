<template>
    <div>
      <h2>AutoMod Tools</h2>
  
      <!-- Form for adding individual inappropriate terms -->
      <form @submit.prevent="addInappropriateTerm">
        <label>Inappropriate Term:</label>
        <input type="text" required v-model="inappropriate_term">
        <button type="submit">Add</button>
      </form>
  
      <!-- Form for adding inappropriate phrases -->
      <form @submit.prevent="addInappropriatePhrase">
        <label>Inappropriate Phrase:</label>
        <input type="text" required v-model="inappropriate_phrase">
        <button type="submit">Add</button>
      </form>
    </div>

    <div>
      <h2>Flagged Posts</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Content</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(post, index) in flaggedPosts" :key="index">
            <td>{{ post.id }}</td>
            <td>{{ post.content }}</td>
            <td>
              <button @click="reviewPost(post)">Review</button>
              <button @click="ignorePost(post)">Ignore</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  </template>

  <script>
  import { QuillEditor } from '@vueup/vue-quill';
  import '@vueup/vue-quill/dist/vue-quill.snow.css';

  import { db } from '@/firebase';
  import { collection, query, where, getDocs, or, and } from "firebase/firestore";

  export default {
  data() {
    return {
      inappropriate_term: '',
      inappropriate_phrase: '',
      flaggedPosts: [],
      inappropriateWords: [],
      inappropriatePhrases: [],
    };
  },
  methods: {
    async addInappropriateTerm() {
      if (this.inappropriate_term.trim() !== '') {
        try {
          await this.addTermToFirestore(this.inappropriate_term.trim());
          this.inappropriate_term = '';
        } catch (error) {
          console.error("Error adding inappropriate term:", error);
        }
      }
    },
    async addInappropriatePhrase() {
      if (this.inappropriate_phrase.trim() !== '') {
        try {
          await this.addPhraseToFirestore(this.inappropriate_phrase.trim());
          this.inappropriate_phrase = '';
        } catch (error) {
          console.error("Error adding inappropriate phrase:", error);          
        }
      }
    },
    async checkForFlaggedPosts() {
      const postsRef = collection(db, 'userPosts');
      const querySnapshot = await getDocs(postsRef);

      querySnapshot.forEach((doc) => {
        const post = doc.data();
        if (this.checkForInappropriateContent(post.content)) {
          this.flaggedPosts.push({
            id: doc.id,
            content: post.content,
          });
        }
      });
    },
    async fetchInappropriateWords() {
      const wordsRef = collection(db, 'inappropriate_words');
      const snapshot = await getDocs(wordsRef);
      snapshot.forEach((doc) => {
        this.inappropriateWords.push(doc.data().word);
      });
    },
    async fetchInappropriatePhrases() {
      const phrasesRef = collection(db, 'inappropriate_phrases');
      const snapshot = await getDocs(phrasesRef);
      snapshot.forEach((doc) => {
        this.inappropriatePhrases.push(doc.data().phrase);
      });
    },
    checkForInappropriateContent(content) {
      for (const word of this.inappropriateWords) {
        if (content.toLowerCase().includes(word.toLowerCase())) {
          return true;
        }
      }
      for (const phrase of this.inappropriatePhrases) {
        if (content.toLowerCase().includes(phrase.toLowerCase())) {
          return true;
        }
      }
      return false;
    },
    async reviewPost(post) {
      console.log('Reviewing post:', post);
    },
    async ignorePost(post) {
      console.log('Ignoring post:', post);
    },
  },
  async mounted() {
    await Promise.all([this.fetchInappropriateWords(), this.fetchInappropriatePhrases()]);
    this.checkForFlaggedPosts();
  },
};
  </script>

  <style scoped>
  div:nth-child(1) {
    margin-bottom: 20px;
  }

  form {
    display: flex;
    flex-direction: column;
    max-width: 300px;
    margin-bottom: 20px;
  }

  label {
    margin-bottom: 8px;
    font-weight: bold;
  }

  input {
    padding: 8px;
    margin-bottom: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    background-color: #007BFF;
    color: #fff;
    border: none;
    padding: 10px;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background-color: #0056b3;
  }

  /* Styles for the Flagged Posts section */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  button {
    margin-right: 5px;
  }
</style>