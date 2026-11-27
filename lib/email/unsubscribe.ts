import { createHmac, timingSafeEqual } from "node:crypto";

// Stateless one-click unsubscribe links: "<base64url userId>.<base64url HMAC>".

const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(`unsubscribe:${payload}`).digest();

export function createUnsubscribeToken(userId: string, secret: string): string {
  const payload = Buffer.from(userId).toString("base64url");
  return `${payload}.${sign(payload, secret).toString("base64url")}`;
}

/** Returns the user id if the token is authentic, otherwise null. */
export function verifyUnsubscribeToken(token: string, secret: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const [payload, signature] = parts;
  const expected = sign(payload, secret);
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  const userId = Buffer.from(payload, "base64url").toString("utf8");
  return userId || null;
}
