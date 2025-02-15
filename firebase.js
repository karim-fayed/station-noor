
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAL2-JNGE6oTtgVWaQH2laI45G__2nop-8",
  authDomain: "station-noor.firebaseapp.com",
  databaseURL: "https://station-noor-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "station-noor",
  storageBucket: "station-noor.firebasestorage.app",
  messagingSenderId: "484521869869",
  appId: "1:484521869869:web:40609e41312fefe015eea4",
  measurementId: "G-8CYVV6YPG3"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

export { app, analytics, database };
