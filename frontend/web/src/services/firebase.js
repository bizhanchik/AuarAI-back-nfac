// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1lwnOZlHq9Uy9Jpmvk2ZycqQw8lmKgTM",
  authDomain: "auarai.firebaseapp.com",
  projectId: "auarai",
  storageBucket: "auarai.firebasestorage.app",
  messagingSenderId: "372400751928",
  appId: "1:372400751928:web:2297921abd29ed2028edcd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  hd: undefined // Allow any domain
});

// Add additional scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Google Sign In function with better error handling
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

// Sign Out function
export const signOutUser = () => signOut(auth);

export default app; 