// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBd4EYLNfVnMV3BUXLnJ5ng8MD_aIbzNr8",
  authDomain: "allenare-ee28f.firebaseapp.com",
  projectId: "allenare-ee28f",
  storageBucket: "allenare-ee28f.appspot.com",
  messagingSenderId: "554929357539",
  appId: "1:554929357539:web:d8e6a2908956bfde03bbd6",
  measurementId: "G-E9G4L3H7LR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { analytics };