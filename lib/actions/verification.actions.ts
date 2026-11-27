"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { getSessionUser } from "@/lib/better-auth/session";
import { isDemoEmail } from "@/lib/demo/constants";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

type Result = { success: true } | { success: false; error: string };

/**
 * Email a fresh verification link to the signed-in user. Takes no input: the
 * address always comes from the session, so this can never email anyone else.
 */
export async function resendVerificationEmail(): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Please sign in." };
  if (user.emailVerified) return { success: false, error: "Your email is already verified." };
  if (isDemoEmail(user.email)) {
    return { success: false, error: "The demo account doesn't use email." };
  }

  const limit = await checkRateLimit(`verify-email:${user.id}`, RATE_LIMITS.verificationEmail);
  if (!limit.allowed) {
    return {
      success: false,
      error: "You've requested several emails already. Please check your inbox and spam folder, or try again in an hour.",
    };
  }

  try {
    await auth.api.sendVerificationEmail({
      body: { email: user.email, callbackURL: "/" },
      headers: await headers(),
    });
    return { success: true };
  } catch (err) {
    console.error("Resending the verification email failed:", err);
    return { success: false, error: "We couldn't send the email right now. Please try again in a few minutes." };
  }
}
