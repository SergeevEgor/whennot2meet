import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAUfy29gORqjpf6DmRP9pD01SRpiRn2nzI",
  authDomain: "whennot2meet.firebaseapp.com",
  projectId: "whennot2meet",
  storageBucket: "whennot2meet.firebasestorage.app",
  messagingSenderId: "574188581741",
  appId: "1:574188581741:web:865f4be061ecd39c61a064",
  measurementId: "G-82Z7K2P6BL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
