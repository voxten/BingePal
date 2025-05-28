import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDtXMBaUCWrNZZcyJ_kfID3H1ppkdN_Vxk",
    authDomain: "series-tracker-e8419.firebaseapp.com",
    projectId: "series-tracker-e8419",
    storageBucket: "series-tracker-e8419.firebasestorage.app",
    messagingSenderId: "612189787516",
    appId: "1:612189787516:web:03db2fe323a02ecb0bc0f9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider  };