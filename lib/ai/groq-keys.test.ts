import { describe, expect, it } from "vitest";

import { isGroqKeyExhausted } from "@/lib/ai/groq-errors";
import { parseGroqApiKeys } from "@/lib/ai/groq-keys";

describe("parseGroqApiKeys", () => {
  it("splits comma-separated keys and trims whitespace", () => {
    expect(parseGroqApiKeys(" key-a , key-b,  key-c ")).toEqual([
      "key-a",
      "key-b",
      "key-c",
    ]);
  });

  it("returns empty array for missing or blank env", () => {
    expect(parseGroqApiKeys(undefined)).toEqual([]);
    expect(parseGroqApiKeys("  ,  , ")).toEqual([]);
  });
});

describe("isGroqKeyExhausted", () => {
  it("detects HTTP 429", () => {
    expect(isGroqKeyExhausted(429, null)).toBe(true);
  });

  it("detects rate_limit_exceeded code in body", () => {
    expect(
      isGroqKeyExhausted(400, {
        error: { code: "rate_limit_exceeded", message: "Rate limit" },
      }),
    ).toBe(true);
  });

  it("does not treat generic 400 as exhausted", () => {
    expect(
      isGroqKeyExhausted(400, { error: { message: "invalid model" } }),
    ).toBe(false);
  });
});
