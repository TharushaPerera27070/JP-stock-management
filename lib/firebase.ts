// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeLqJror8iF3WC3n8jYt2EOduMzgYok5c",
  authDomain: "jp-inventory-management.firebaseapp.com",
  projectId: "jp-inventory-management",
  storageBucket: "jp-inventory-management.firebasestorage.app",
  messagingSenderId: "555427272333",
  appId: "1:555427272333:web:2f604060dd6b015fbe34c4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export the initialized app (and other services like db, auth when added)
export { app, db };
