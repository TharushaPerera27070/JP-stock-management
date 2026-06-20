import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3ST4CgsDdEpbElgQMa_s0zZCuCMWIPc8",
  authDomain: "japan-basic-erp.firebaseapp.com",
  projectId: "japan-basic-erp",
  storageBucket: "japan-basic-erp.firebasestorage.app",
  messagingSenderId: "878245982841",
  appId: "1:878245982841:web:b4f277230cad64b71f9aa8"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
