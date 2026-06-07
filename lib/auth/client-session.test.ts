import { describe, expect, it } from "vitest";

import {
  isMissingOrInvalidSession,
  isTransientSessionFetchError,
} from "@/lib/auth/client-session";

describe("client session errors", () => {
  it("detects transient fetch failures", () => {
    expect(isTransientSessionFetchError(new TypeError("Failed to fetch"))).toBe(
      true,
    );
    expect(isTransientSessionFetchError({ message: "NetworkError" })).toBe(
      true,
    );
  });

  it("does not treat network errors as expired sessions", () => {
    expect(
      isMissingOrInvalidSession(null, new TypeError("Failed to fetch")),
    ).toBe(false);
  });

  it("treats missing user without error as signed out", () => {
    expect(isMissingOrInvalidSession(null, null)).toBe(true);
  });

  it("treats auth session missing as signed out", () => {
    expect(
      isMissingOrInvalidSession(null, {
        name: "AuthSessionMissingError",
        message: "Auth session missing!",
      }),
    ).toBe(true);
  });
});
