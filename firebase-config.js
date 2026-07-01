// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD5dB8IFyrpgvyOymbcJFu-4XPM_Rig26Y",
  authDomain: "datewithbilli.firebaseapp.com",
  projectId: "datewithbilli",
  storageBucket: "datewithbilli.firebasestorage.app",
  messagingSenderId: "706199746461",
  appId: "1:706199746461:web:d9da6b5aeca30f3348e174",
  measurementId: "G-PXS59MR34V"
};

// Initialize Firebase App
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
