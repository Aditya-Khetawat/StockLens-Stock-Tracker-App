import { describe, expect, it } from "vitest";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "./unsubscribe";

const SECRET = "test-secret-at-least-32-characters-long";

describe("unsubscribe tokens", () => {
  it("round-trips the user id", () => {
    const token = createUnsubscribeToken("6b0977cf2ff9d55d7fd1762d", SECRET);
    expect(verifyUnsubscribeToken(token, SECRET)).toBe("6b0977cf2ff9d55d7fd1762d");
  });

  it("rejects a token whose user id was changed", () => {
    const token = createUnsubscribeToken("6b0977cf2ff9d55d7fd1762d", SECRET);
    const [, signature] = token.split(".");
    const forged = `${Buffer.from("aaaaaaaaaaaaaaaaaaaaaaaa").toString("base64url")}.${signature}`;
    expect(verifyUnsubscribeToken(forged, SECRET)).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    const token = createUnsubscribeToken("6b0977cf2ff9d55d7fd1762d", "another-secret-also-32-characters!!");
    expect(verifyUnsubscribeToken(token, SECRET)).toBeNull();
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "abc", "a.b.c", ".", "x."]) {
      expect(verifyUnsubscribeToken(bad, SECRET)).toBeNull();
    }
  });
});
