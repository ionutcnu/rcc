// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: "redcatcuasar.firebaseapp.com",
    projectId: "redcatcuasar",
    storageBucket: "redcatcuasar.appspot.com",
    messagingSenderId: "863107688030",
    appId: "1:863107688030:web:c3ed93b6f27f1da094b6cf",
    measurementId: "G-FLBNGQRT5Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
