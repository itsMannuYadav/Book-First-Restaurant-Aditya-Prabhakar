"use client";

import { auth } from "@/lib/firebase/client";

export class OwnerApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "OwnerApiError";
    this.status = status;
    this.code = code;
  }
}

/** fetch wrapper that attaches the caller's Firebase ID token as a bearer. */
export async function ownerFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!auth?.currentUser) {
    throw new OwnerApiError("You must be signed in.", 401);
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
    throw new OwnerApiError(`Request failed (${response.status})`, response.status);
  }

  if (!response.ok) {
    throw new OwnerApiError(
      typeof json.message === "string"
        ? json.message
        : `Request failed (${response.status})`,
      response.status,
      typeof json.code === "string" ? json.code : undefined,
    );
  }
  return json as T;
}
