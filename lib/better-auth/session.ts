import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";

/** The signed-in user for this request, or null. Deduplicated per request. */
export const getSessionUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});
