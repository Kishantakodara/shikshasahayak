import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration with robust production fallbacks
const getEnv = (key: string, fallback: string): string => {
  try {
    const envObj = (import.meta as any)?.env as Record<string, string | undefined> | undefined;
    if (envObj && envObj[key]) {
      return envObj[key] as string;
    }
  } catch {}
  return fallback;
};

const getAuthDomain = () => {
  const envDomain = getEnv('VITE_FIREBASE_AUTH_DOMAIN', '');
  if (envDomain) return envDomain;
  return "shikshasahayak-demo.firebaseapp.com";
};

// Your web app's Firebase configuration with robust production fallbacks
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', "AIzaSyDemoShikshaSahayakMockKey12345"),
  authDomain: getAuthDomain(),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', "padhakuportal"),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', "shikshasahayak-demo.appspot.com"),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', "123456789012"),
  appId: getEnv('VITE_FIREBASE_APP_ID', "1:123456789012:web:mockshikshasahayak123")
};

// Initialize Firebase App & Auth single instance
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Force the account selection prompt for Google OAuth
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, auth, googleProvider };
