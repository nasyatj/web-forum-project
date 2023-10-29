import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDF3cwg7r4L2kCG-GYFIQUbpZ8q6Fwbe14",
  authDomain: "cps714-webforum.firebaseapp.com",
  projectId: "cps714-webforum",
  storageBucket: "cps714-webforum.appspot.com",
  messagingSenderId: "962469603977",
  appId: "1:962469603977:web:431057b5aba67c3a68b458"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// to use db in a file: import db from '@/firebase'
export {
    db
}


