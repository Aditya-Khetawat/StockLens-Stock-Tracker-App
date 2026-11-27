import { inngest } from "@/lib/inngest/client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/data/users";
import { getWatchlistSymbolsByEmail } from "@/lib/data/watchlist";
import { getNews } from "@/lib/finnhub/client";
import { getFormattedTodayDate } from "@/lib/utils";
import { resetDemoAccount } from "@/lib/demo/account";
import { findDemoUserId } from "@/lib/data/users";
import {
  getTradingUserIds,
  recordEquitySnapshot,
} from "@/lib/services/equitySnapshot.service";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    // Only email addresses whose owner clicked the verification link get
    // anything beyond the verification email itself.
    const verified = await step.waitForEvent("wait-for-email-verification", {
      event: "app/user.verified",
      match: "data.email",
      timeout: "7d",
    });
    if (!verified) {
      return { success: false, message: "Email never verified; welcome email skipped" };
    }

    const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile,
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining StockLens. You now have the tools to track markets and make smarter moves.";

      const {
        data: { userId, email, name },
      } = event;

      return await sendWelcomeEmail({ userId, email, name, intro: introText });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  },
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    // Step #1: Get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0)
      return { success: false, message: "No users found for news email" };

    // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{
        user: UserForNewsEmail;
        articles: MarketNewsArticle[];
      }> = [];
      for (const user of users as UserForNewsEmail[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);
          // Enforce max 6 articles per user
          articles = (articles || []).slice(0, 6);
          // If still empty, fallback to general
          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error("daily-news: error preparing user news", user.email, e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    // Step #3: (placeholder) Summarize news via AI
    const userNewsSummaries: {
      user: UserForNewsEmail;
      newsContent: string | null;
    }[] = [];

    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(articles, null, 2),
        );

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news.";

        userNewsSummaries.push({ user, newsContent });
      } catch (e) {
        console.error("Failed to summarize news for:", user.email, e);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step #4: (placeholder) Send the emails
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            userId: user.id,
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent,
          });
        }),
      );
    });

    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  },
);

// Values every trading account at market prices after the US close, so the
// P&L chart and risk metrics move with the market, not only when users trade.
export const snapshotDailyEquity = inngest.createFunction(
  { id: "snapshot-daily-equity" },
  [{ cron: "30 21 * * 1-5" }, { event: "app/equity.snapshot" }],
  async ({ step }) => {
    const date = new Date().toISOString().slice(0, 10);
    const userIds = await step.run("list-trading-users", getTradingUserIds);

    let recorded = 0;
    for (const userId of userIds) {
      // One step per user: isolated retries, and one bad account cannot block the rest.
      const result = await step.run(`snapshot-${userId}`, () =>
        recordEquitySnapshot(userId, date),
      );
      if (result.recorded) recorded++;
    }

    return { date, users: userIds.length, recorded };
  },
);

// Undo visitors' trades and watchlist edits on the shared demo account. Runs
// before the 21:30 UTC snapshot so the demo's equity history tracks its
// permanent starting holdings.
export const resetDemoAccountNightly = inngest.createFunction(
  { id: "reset-demo-account" },
  [{ cron: "0 21 * * *" }, { event: "app/demo.reset" }],
  async ({ step }) => {
    const userId = await step.run("find-demo-user", findDemoUserId);
    if (!userId) return { reset: false, reason: "Demo account not created yet" };
    const result = await step.run("reset-demo-account", () => resetDemoAccount(userId));
    return { reset: true, ...result };
  },
);
