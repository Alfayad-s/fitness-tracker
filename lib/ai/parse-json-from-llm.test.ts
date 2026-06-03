import { describe, expect, it } from "vitest";

import { parseJsonFromLlm } from "@/lib/ai/parse-json-from-llm";

describe("parseJsonFromLlm", () => {
  it("parses JSON inside markdown fences", () => {
    const result = parseJsonFromLlm<{ weightKg: number }>(
      'Here is data:\n```json\n{"weightKg": 75}\n```',
    );
    expect(result.weightKg).toBe(75);
  });
});
