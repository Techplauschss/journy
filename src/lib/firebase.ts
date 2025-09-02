import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC02VBa_abXTiNV28Am2WrEHFHcMTjwQ0s",
  authDomain: "journy-e76b1.firebaseapp.com",
  projectId: "journy-e76b1",
  storageBucket: "journy-e76b1.firebasestorage.app",
  messagingSenderId: "522479983139",
  appId: "1:522479983139:web:12568593f16964d5d42f96",
  databaseURL: "https://journy-e76b1-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export default app;
