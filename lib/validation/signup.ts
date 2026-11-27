import { z } from "zod";
import { isDemoEmail } from "@/lib/demo/constants";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";

const optionValues = (options: ReadonlyArray<{ value: string }>) =>
  options.map((o) => o.value) as [string, ...string[]];

// Profile fields end up in an AI prompt, so only the form's own options pass.
export const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(80, "Full name is too long."),
  email: z
    .email("Enter a valid email address.")
    // The shared demo account is created by signInAsDemo only.
    .refine((email) => !isDemoEmail(email), "This email address is reserved."),
  password: z.string().min(8).max(128),
  country: z.string().regex(/^[A-Z]{2}$/, "Select a country."),
  investmentGoals: z.enum(optionValues(INVESTMENT_GOALS)),
  riskTolerance: z.enum(optionValues(RISK_TOLERANCE_OPTIONS)),
  preferredIndustry: z.enum(optionValues(PREFERRED_INDUSTRIES)),
});
