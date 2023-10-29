<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDF3cwg7r4L2kCG-GYFIQUbpZ8q6Fwbe14",
    authDomain: "cps714-webforum.firebaseapp.com",
    projectId: "cps714-webforum",
    storageBucket: "cps714-webforum.appspot.com",
    messagingSenderId: "962469603977",
    appId: "1:962469603977:web:431057b5aba67c3a68b458",
    measurementId: "G-T3B6L2FV3P"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>