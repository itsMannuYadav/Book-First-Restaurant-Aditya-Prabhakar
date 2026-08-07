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

  const json = (await response.json().catch(() => ({}))) as {
    message?: string;
    code?: string;
  } & T;

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
