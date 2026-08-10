import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
} from "firebase/auth";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase auth is only available in the browser");
  }

  if (!auth) {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
  }

  return auth;
}

export async function signInWithGoogle() {
  const authInstance = getFirebaseAuth();
  const googleProvider = new GoogleAuthProvider();
  const result = await signInWithPopup(authInstance, googleProvider);
  const user = result.user;
  return {
    googleId: user.uid,
    email: user.email || "",
    firstName: user.displayName?.split(" ")[0] || "",
    lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
  };
}
