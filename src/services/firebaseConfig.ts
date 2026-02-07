import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBjuGLZ4cSaddCTcsYEq7Ma50xRyk3teuU",
  authDomain: "cubblast.firebaseapp.com",
  databaseURL:
    "https://cubblast-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cubblast",
  storageBucket: "cubblast.firebasestorage.app",
  messagingSenderId: "997299458454",
  appId: "1:997299458454:web:b8521526b7812d00e00db7",
  measurementId: "G-K8HD3LB70M",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
