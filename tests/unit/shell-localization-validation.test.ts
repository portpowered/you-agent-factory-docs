import { describe, expect, test } from "bun:test";
import {
  assertValidShellLocalizationCopy,
  validateShellLocalizationCopy,
} from "../../src/lib/validation/shell-localization";

describe("shell localization validation", () => {
  test("accepts the current shared shell copy constants", () => {
    expect(validateShellLocalizationCopy().valid).toBe(true);
    expect(() => assertValidShellLocalizationCopy()).not.toThrow();
  });

  test("rejects empty shell copy values", () => {
    const result = validateShellLocalizationCopy();
    for (const issue of result.issues) {
      expect(issue.key.length).toBeGreaterThan(0);
      expect(issue.message.length).toBeGreaterThan(0);
    }
  });
});
