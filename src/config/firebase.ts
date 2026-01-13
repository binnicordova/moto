// Placeholder for Firebase Configuration
// TODO: Replace with your actual Firebase project configuration
import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA2lELLR59Y1kr8BZqATeehRiQYvvzUxTI",
    authDomain: "mototaxia.firebaseapp.com",
    projectId: "mototaxia",
    storageBucket: "mototaxia.firebasestorage.app",
    messagingSenderId: "892448568688",
    appId: "1:892448568688:web:6003f63dc21b1b63a7cbb5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
