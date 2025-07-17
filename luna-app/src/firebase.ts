// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDA-5h7WxUgWEQrBTn99OwL_S2m8uVVzyY",
  authDomain: "lunaapp-c1895.firebaseapp.com",
  projectId: "lunaapp-c1895",
  storageBucket: "lunaapp-c1895.firebasestorage.app",
  messagingSenderId: "403170462364",
  appId: "1:403170462364:web:6cd2eabe3f4c431e973b59",
  measurementId: "G-TSRQSVQFSL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth }; // ⬅️ this line is important!
