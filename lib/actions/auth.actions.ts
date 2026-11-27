"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { checkRateLimit, clientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { signUpSchema } from "@/lib/validation/signup";

type ActionResult = { success: true } | { success: false; error: string };

export const signUpWithEmail = async (input: SignUpFormData): Promise<ActionResult> => {
  if (!(await checkRateLimit(`signup:${await clientIp()}`, RATE_LIMITS.signUp)).allowed) {
    return { success: false, error: "Too many sign-up attempts. Please try again later." };
  }
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid sign-up details." };
  }
  const { email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry } =
    parsed.data;

  let userId: string;
  try {
    const response = await auth.api.signUpEmail({
      // callbackURL: where the verification link lands once the email is confirmed.
      body: { email, password, name: fullName, callbackURL: "/" },
    });
    userId = response.user.id;
  } catch (e) {
    console.error("Sign up failed", e);
    return { success: false, error: "Sign up failed. The email may already be registered." };
  }

  // The account exists now; a queue hiccup must not report sign-up as failed.
  await inngest
    .send({
      name: "app/user.created",
      data: { userId, email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry },
    })
    .catch((err) => console.error("Failed to emit app/user.created:", err));

  return { success: true };
};

export const signInWithEmail = async ({ email, password }: SignInFormData): Promise<ActionResult> => {
  if (!(await checkRateLimit(`signin:${await clientIp()}`, RATE_LIMITS.signIn)).allowed) {
    return { success: false, error: "Too many sign-in attempts. Please wait a few minutes." };
  }
  try {
    await auth.api.signInEmail({ body: { email, password } });
    return { success: true };
  } catch (e) {
    console.error("Sign in failed", e);
    return { success: false, error: "Invalid email or password." };
  }
};

export const signOut = async (): Promise<ActionResult> => {
  try {
    await auth.api.signOut({ headers: await headers() });
    return { success: true };
  } catch (e) {
    console.error("Sign out failed", e);
    return { success: false, error: "Sign out failed" };
  }
};
