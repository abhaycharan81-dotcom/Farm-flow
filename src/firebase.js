import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase web config is not a secret: it identifies the project, it does not grant access.
// Access is controlled by the database rules and by the authorized domains in Firebase Auth.
const firebaseConfig = {
  apiKey: "AIzaSyD8bPjCoA6QjisNle2MGGNqFKkKa4ELZYE",
  authDomain: "farm-flow-react-app.firebaseapp.com",
  databaseURL: "https://farm-flow-react-app-default-rtdb.firebaseio.com",
  projectId: "farm-flow-react-app",
  storageBucket: "farm-flow-react-app.firebasestorage.app",
  messagingSenderId: "385475774491",
  appId: "1:385475774491:web:dbba7403407a7bf41650be",
  measurementId: "G-V6K2BN8KFZ",
};

const app = initializeApp(firebaseConfig);

// Analytics is optional. It throws or is blocked in some browsers (ad blockers, private mode),
// and that must never stop the app from loading.
isSupported()
  .then((ok) => { if (ok) getAnalytics(app); })
  .catch(() => {});

export const auth = getAuth(app);
export const db = getDatabase(app);
