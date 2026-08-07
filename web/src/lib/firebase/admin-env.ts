export type AdminServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

/**
 * Env-only helpers — safe to import from API routes without loading firebase-admin.
 * (Loading firebase-admin at module scope has been crashing Vercel serverless boots.)
 */
export function readServiceAccount(): AdminServiceAccount | null {
  const json = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      const parsed = JSON.parse(json) as Record<string, unknown>;
      const projectId = String(parsed.projectId ?? parsed.project_id ?? "");
      const clientEmail = String(
        parsed.clientEmail ?? parsed.client_email ?? "",
      );
      let privateKey = String(parsed.privateKey ?? parsed.private_key ?? "");
      if (!projectId || !clientEmail || !privateKey) return null;
      privateKey = privateKey.replace(/\\n/g, "\n");
      return { projectId, clientEmail, privateKey };
    } catch {
      console.warn(
        "[firebase-admin] FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is invalid; trying FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY",
      );
    }
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();

  if (!projectId || !clientEmail || !privateKey) return null;

  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }

  // Vercel sometimes stores literal \\n as well as \n.
  privateKey = privateKey.replace(/\\n/g, "\n");

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

export function isAdminConfigured(): boolean {
  try {
    return readServiceAccount() !== null;
  } catch {
    return false;
  }
}

export function adminEnvDiagnostics() {
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "";
  return {
    hasProjectId: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID?.trim()),
    hasClientEmail: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim()),
    hasPrivateKey: Boolean(key.trim()),
    privateKeyLength: key.trim().length,
    privateKeyLooksPem: key.includes("BEGIN PRIVATE KEY"),
    hasServiceAccountJson: Boolean(
      process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON?.trim(),
    ),
    hasAdminEmails: Boolean(
      process.env.ADMIN_EMAILS?.trim() ||
        process.env.NEXT_PUBLIC_ADMIN_EMAILS?.trim(),
    ),
    adminConfigured: isAdminConfigured(),
    nodeEnv: process.env.NODE_ENV ?? null,
  };
}
