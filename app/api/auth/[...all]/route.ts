import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/better-auth/auth";

// Better Auth's HTTP endpoints, including the email verification links.
export const { GET, POST } = toNextJsHandler(auth);
