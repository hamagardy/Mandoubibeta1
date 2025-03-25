import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions"; // Add this import

const firebaseConfig = {
  apiKey: "AIzaSyChfXRZgrncJL0f-FqOISAHLQqqcPBxrB8",
  authDomain: "mandob-52a17.firebaseapp.com",
  databaseURL: "https://mandob-52a17-default-rtdb.firebaseio.com",
  projectId: "mandob-52a17",
  storageBucket: "mandob-52a17.firebasestorage.app",
  messagingSenderId: "548592867606",
  appId: "1:548592867606:web:8b4c0231cd6e0d74199837",
  measurementId: "G-B8KMJC34DV",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app); // Export functions instance

export default app;
