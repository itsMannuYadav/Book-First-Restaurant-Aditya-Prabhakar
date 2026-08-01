import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function createAccessToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function tokensMatch(token: string, hash: string): boolean {
  try {
    const a = Buffer.from(hashAccessToken(token), "hex");
    const b = Buffer.from(hash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Short shout-able code for staff (e.g. A7K2). */
export function createShortCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(4);
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}
