import { describe, expect, it } from "vitest";
import { signUpSchema } from "./signup";

const valid = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  password: "correct-horse-battery",
  country: "GB",
  investmentGoals: "Growth",
  riskTolerance: "Medium",
  preferredIndustry: "Technology",
};

describe("signUpSchema", () => {
  it("accepts a normal sign-up", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it.each(["demo@stocklens.demo", "DEMO@StockLens.demo"])(
    "refuses the reserved demo address %s, so nobody can claim the shared account",
    (email) => {
      const result = signUpSchema.safeParse({ ...valid, email });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("This email address is reserved.");
    },
  );
});
