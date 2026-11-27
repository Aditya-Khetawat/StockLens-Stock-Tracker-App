// Better Auth serves every endpoint it has (sign-in, change-password,
// delete-user, list-sessions...) under /api/auth. The app reaches sign-up,
// sign-in and sign-out through rate-limited, validated server actions, so the
// only request that must arrive over HTTP is the verification link in the
// sign-up email. Everything else is refused, which also keeps visitors of the
// shared demo account from changing its password or reading its sessions.
const PUBLIC_AUTH_REQUESTS = new Set(["GET /api/auth/verify-email"]);

export function isPublicAuthRequest(method: string, pathname: string): boolean {
  return PUBLIC_AUTH_REQUESTS.has(`${method.toUpperCase()} ${pathname.replace(/\/+$/, "")}`);
}
