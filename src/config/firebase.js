import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAENW2kadJc6GydbsuUXsabKSZTdyXP8Qw",
  authDomain: "generator-soal-2232b.firebaseapp.com",
  projectId: "generator-soal-2232b",
  storageBucket: "generator-soal-2232b.firebasestorage.app",
  messagingSenderId: "860611577077",
  appId: "1:860611577077:web:669f20d09172d8d87f31bc",
  measurementId: "G-1NBBPGLRMM"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
