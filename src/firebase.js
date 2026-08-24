import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  signInWithCredential 
} from 'firebase/auth';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAavJrDTw2AeuEsBGOCCw81yW7oIqp834U",
  authDomain: "loop-2026lp.firebaseapp.com",
  projectId: "loop-2026lp",
  storageBucket: "loop-2026lp.firebasestorage.app",
  messagingSenderId: "625488353758",
  appId: "1:625488353758:web:0165d3c0ac52f73bd8254f",
  measurementId: "G-85QNEE5EWP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Log initialization status
console.log('🔥 Firebase initialized:', !!app);
console.log('🔑 Auth initialized:', !!auth);

export { 
  auth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  signInWithCredential 
};