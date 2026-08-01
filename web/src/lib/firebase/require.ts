import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

export function requireFirebase(): { auth: Auth; db: Firestore } {
  if (!isFirebaseConfigured() || !auth || !db) {
    throw new Error(
      "Firebase is not configured. Check your .env / .env.local values and restart the dev server.",
    );
  }
  return { auth, db };
}
