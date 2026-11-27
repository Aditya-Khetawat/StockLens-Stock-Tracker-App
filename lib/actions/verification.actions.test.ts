import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string; emailVerified: boolean } | null,
  allowed: true,
  sendFails: false,
  sent: [] as Array<{ body: unknown; headers: unknown }>,
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers({ cookie: "session=abc" }) }));
vi.mock("@/lib/better-auth/session", () => ({ getSessionUser: async () => state.user }));
vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: { verificationEmail: { limit: 3, windowSeconds: 3600 } },
  checkRateLimit: async () => ({ allowed: state.allowed, retryAfterSeconds: 60 }),
}));
vi.mock("@/lib/better-auth/auth", () => ({
  auth: {
    api: {
      sendVerificationEmail: async (args: { body: unknown; headers: unknown }) => {
        if (state.sendFails) throw new Error("SMTP down");
        state.sent.push(args);
        return { status: true };
      },
    },
  },
}));

const { resendVerificationEmail } = await import("./verification.actions");

beforeEach(() => {
  state.user = { id: "u1", email: "ada@example.com", emailVerified: false };
  state.allowed = true;
  state.sendFails = false;
  state.sent = [];
});

describe("resendVerificationEmail", () => {
  it("sends a fresh link to the signed-in user's own address", async () => {
    expect(await resendVerificationEmail()).toEqual({ success: true });
    expect(state.sent).toHaveLength(1);
    expect(state.sent[0].body).toEqual({ email: "ada@example.com", callbackURL: "/" });
    expect(state.sent[0].headers).toBeInstanceOf(Headers);
  });

  it("requires a session", async () => {
    state.user = null;
    expect(await resendVerificationEmail()).toEqual({ success: false, error: "Please sign in." });
    expect(state.sent).toHaveLength(0);
  });

  it("does nothing for an already verified address", async () => {
    state.user = { id: "u1", email: "ada@example.com", emailVerified: true };
    expect(await resendVerificationEmail()).toEqual({ success: false, error: "Your email is already verified." });
    expect(state.sent).toHaveLength(0);
  });

  it("never emails the shared demo address", async () => {
    state.user = { id: "d", email: "demo@stocklens.demo", emailVerified: false };
    expect((await resendVerificationEmail()).success).toBe(false);
    expect(state.sent).toHaveLength(0);
  });

  it("is rate limited", async () => {
    state.allowed = false;
    expect(await resendVerificationEmail()).toEqual({
      success: false,
      error: "You've requested several emails already. Please check your inbox and spam folder, or try again in an hour.",
    });
    expect(state.sent).toHaveLength(0);
  });

  it("reports a failed send without leaking the cause", async () => {
    state.sendFails = true;
    expect(await resendVerificationEmail()).toEqual({
      success: false,
      error: "We couldn't send the email right now. Please try again in a few minutes.",
    });
  });
});
