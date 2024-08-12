import { initializeApp, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { AsyncStorage } from 'react-native';

const firebaseAPIKEY = process.env.EXPO_PUBLIC_FIREBASE_APIKEY;

const firebaseConfig = {
  apiKey: firebaseAPIKEY,
  authDomain: "gemiapi.firebaseapp.com",
  databaseURL:
    "https://gemiapi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gemiapi",
  storageBucket: "gemiapi.appspot.com",
  messagingSenderId: "1023594646423",
  appId: "1:1023594646423:web:c28e9d8e575d123c1652d2",
  measurementId: "G-6QQ333ZD1N",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getDatabase(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { db, storage, app, auth, getApp, getAuth };
