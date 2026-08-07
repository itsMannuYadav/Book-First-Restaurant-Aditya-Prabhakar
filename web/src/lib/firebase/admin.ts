import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function readServiceAccount(): ServiceAccount | null {
  const json = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      const parsed = JSON.parse(json) as ServiceAccount;
      return parsed;
    } catch {
      // Fall through to discrete vars — a partial/multiline paste is common.
      console.warn(
        "[firebase-admin] FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is invalid; trying FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY",
      );
    }
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();

  if (!projectId || !clientEmail || !privateKey) return null;

  // Strip wrapping quotes from .env values.
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }

  // Support escaped newlines from .env files.
  privateKey = privateKey.replace(/\\n/g, "\n");

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

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

  app = initializeApp({
    credential: cert(serviceAccount),
    projectId:
      typeof serviceAccount.projectId === "string"
        ? serviceAccount.projectId
        : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  return app;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function isAdminConfigured(): boolean {
  try {
    return readServiceAccount() !== null;
  } catch {
    return false;
  }
}
