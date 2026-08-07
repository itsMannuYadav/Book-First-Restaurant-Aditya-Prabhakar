import { auth, db, isFirebaseConfigured, storage } from "@/lib/firebase/client";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

export function requireFirebase(): { auth: Auth; db: Firestore } {
  if (!isFirebaseConfigured() || !auth || !db) {
    throw new Error(
      "Firebase is not configured. Check your .env / .env.local values and restart the dev server.",
    );
  }
  return { auth, db };
}

export function requireFirebaseStorage(): {
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
} {
  const base = requireFirebase();
  if (!storage) {
    throw new Error(
      "Firebase Storage is not configured. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET and restart the dev server.",
    );
  }
  return { ...base, storage };
}
