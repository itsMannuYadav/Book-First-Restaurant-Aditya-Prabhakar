import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import {
  isAdminConfigured,
  readServiceAccount,
} from "@/lib/firebase/admin-env";

export { isAdminConfigured, readServiceAccount } from "@/lib/firebase/admin-env";

let app: App | null = null;

export function getAdminApp(): App {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }

  const serviceAccount = readServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY (or FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON).",
    );
  }

  try {
    app = initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
      projectId:
        serviceAccount.projectId ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Firebase Admin failed to initialize (check FIREBASE_ADMIN_PRIVATE_KEY formatting on Vercel): ${message}`,
    );
  }
  return app;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
