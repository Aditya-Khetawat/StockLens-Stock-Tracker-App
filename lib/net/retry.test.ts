import { describe, expect, it } from "vitest";
import { HttpError, withRetry } from "./retry";

const fast = { retries: 2, baseDelayMs: 0 };

function failing(statuses: Array<number | "network">, result = "ok") {
  let calls = 0;
  const op = async () => {
    const outcome = statuses[calls++];
    if (outcome === undefined) return result;
    if (outcome === "network") throw new TypeError("fetch failed");
    throw new HttpError(outcome, "upstream");
  };
  return { op, calls: () => calls };
}

describe("withRetry", () => {
  it("retries transient upstream errors and returns the eventual result", async () => {
    const f = failing([503, 429]);
    await expect(withRetry(f.op, fast)).resolves.toBe("ok");
    expect(f.calls()).toBe(3);
  });

  it("retries network failures", async () => {
    const f = failing(["network"]);
    await expect(withRetry(f.op, fast)).resolves.toBe("ok");
    expect(f.calls()).toBe(2);
  });

  it("does not retry client errors", async () => {
    const f = failing([400]);
    await expect(withRetry(f.op, fast)).rejects.toMatchObject({ status: 400 });
    expect(f.calls()).toBe(1);
  });

  it("gives up after the retry budget", async () => {
    const f = failing([502, 502, 502, 502]);
    await expect(withRetry(f.op, fast)).rejects.toMatchObject({ status: 502 });
    expect(f.calls()).toBe(3);
  });
});
