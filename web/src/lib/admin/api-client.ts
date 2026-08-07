"use client";

import { auth } from "@/lib/firebase/client";

export class AdminApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

export async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!auth?.currentUser) {
    throw new AdminApiError("You must be signed in.", 401);
  }
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const raw = await response.text();
  let json: { message?: string; code?: string } & T;
  try {
    json = (raw ? JSON.parse(raw) : {}) as { message?: string; code?: string } & T;
  } catch {
    throw new AdminApiError(
      response.status >= 500
        ? "Server error loading admin data. On Vercel, confirm FIREBASE_ADMIN_* and ADMIN_EMAILS are set, then redeploy."
        : `Request failed (${response.status})`,
      response.status,
    );
  }

  if (!response.ok) {
    throw new AdminApiError(
      typeof json.message === "string"
        ? json.message
        : `Request failed (${response.status})`,
      response.status,
      typeof json.code === "string" ? json.code : undefined,
    );
  }

  return json as T;
}
