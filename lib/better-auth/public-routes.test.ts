import { describe, expect, it } from "vitest";
import { isPublicAuthRequest } from "./public-routes";

describe("isPublicAuthRequest", () => {
  it("allows the email verification link", () => {
    expect(isPublicAuthRequest("GET", "/api/auth/verify-email")).toBe(true);
  });

  it.each([
    ["POST", "/api/auth/sign-up/email"],
    ["POST", "/api/auth/sign-in/email"],
    ["POST", "/api/auth/change-password"],
    ["POST", "/api/auth/change-email"],
    ["POST", "/api/auth/update-user"],
    ["POST", "/api/auth/delete-user"],
    ["GET", "/api/auth/list-sessions"],
    ["POST", "/api/auth/revoke-sessions"],
    ["POST", "/api/auth/verify-email"],
    ["GET", "/api/auth/verify-email/extra"],
  ])("refuses %s %s, which the app only reaches through server actions or never", (method, path) => {
    expect(isPublicAuthRequest(method, path)).toBe(false);
  });
});
