import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/better-auth/auth";
import { isPublicAuthRequest } from "@/lib/better-auth/public-routes";

const handler = toNextJsHandler(auth);

const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

// Only the email verification link is served; see lib/better-auth/public-routes.ts.
export async function GET(request: Request) {
  return isPublicAuthRequest("GET", new URL(request.url).pathname) ? handler.GET(request) : notFound();
}

export async function POST() {
  return notFound();
}
