"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";

type ActionResult = { success: true } | { success: false; error: string };

const optionValues = (options: ReadonlyArray<{ value: string }>) =>
  options.map((o) => o.value) as [string, ...string[]];

// Profile fields end up in an AI prompt, so only the form's own options pass.
const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(80, "Full name is too long."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8).max(128),
  country: z.string().regex(/^[A-Z]{2}$/, "Select a country."),
  investmentGoals: z.enum(optionValues(INVESTMENT_GOALS)),
  riskTolerance: z.enum(optionValues(RISK_TOLERANCE_OPTIONS)),
  preferredIndustry: z.enum(optionValues(PREFERRED_INDUSTRIES)),
});

export const signUpWithEmail = async (input: SignUpFormData): Promise<ActionResult> => {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid sign-up details." };
  }
  const { email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry } =
    parsed.data;

  let userId: string;
  try {
    const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } });
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
