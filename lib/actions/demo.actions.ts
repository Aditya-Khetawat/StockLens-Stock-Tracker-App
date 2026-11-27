"use server";

import { auth } from "@/lib/better-auth/auth";
import { findDemoUserId } from "@/lib/data/users";
import { seedDemoPortfolio } from "@/lib/demo/account";
import { DEMO_EMAIL, DEMO_NAME, demoPassword } from "@/lib/demo/constants";
import { getQuote } from "@/lib/finnhub/client";
import { checkRateLimit, clientIp, RATE_LIMITS } from "@/lib/rate-limit";

/** Sign in to the shared demo account, creating and seeding it on first use. */
export async function signInAsDemo(): Promise<{ success: true } | { success: false; error: string }> {
  if (!(await checkRateLimit(`signin:${await clientIp()}`, RATE_LIMITS.signIn)).allowed) {
    return { success: false, error: "Too many sign-in attempts. Please wait a few minutes." };
  }

  const password = demoPassword(process.env.BETTER_AUTH_SECRET!);

  try {
    let userId = await findDemoUserId();
    if (!userId) {
      try {
        const created = await auth.api.signUpEmail({
          body: { email: DEMO_EMAIL, password, name: DEMO_NAME },
        });
        userId = created.user.id;
      } catch {
        // Another visitor created it a moment ago.
        userId = await findDemoUserId();
      }
    }
    if (!userId) throw new Error("Demo account could not be created");

    await seedDemoPortfolio(userId, {
      getPrice: async (symbol) => {
        const quote = await getQuote(symbol);
        return quote && !quote.stale ? quote.price : null;
      },
    });

    await auth.api.signInEmail({ body: { email: DEMO_EMAIL, password } });
    return { success: true };
  } catch (err) {
    console.error("Demo sign-in failed:", err);
    return { success: false, error: "The demo is unavailable right now. Please try again." };
  }
}
