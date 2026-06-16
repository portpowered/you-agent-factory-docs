import { describe, expect, test } from "bun:test";
import {
  assertValidShellLocalizationCopy,
  getShellLocalizationCopy,
  validateShellLocalizationCopy,
} from "../../src/lib/validation/shell-localization";

describe("shell localization validation", () => {
  test("accepts the current shared shell copy constants", () => {
    expect(validateShellLocalizationCopy().valid).toBe(true);
    expect(() => assertValidShellLocalizationCopy()).not.toThrow();
  });

  test("rejects missing required shell copy keys", () => {
    const copy = getShellLocalizationCopy();
    const { GITHUB_CTA_LABEL: _removed, ...partialCopy } = copy;

    const result = validateShellLocalizationCopy(
      partialCopy as ReturnType<typeof getShellLocalizationCopy>,
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "GITHUB_CTA_LABEL",
          message: "GITHUB_CTA_LABEL is required",
        }),
      ]),
    );
  });

  test("rejects empty shell copy values", () => {
    const copy = {
      ...getShellLocalizationCopy(),
      DOCS_CTA_LABEL: "   ",
    };

    const result = validateShellLocalizationCopy(copy);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "DOCS_CTA_LABEL",
          message: "DOCS_CTA_LABEL must be a non-empty string",
        }),
      ]),
    );
    expect(() => assertValidShellLocalizationCopy(copy)).toThrow(
      /Shell localization validation failed/,
    );
  });

  test("rejects malformed github repository URLs", () => {
    const copy = {
      ...getShellLocalizationCopy(),
      GITHUB_REPO_URL: "not-a-valid-url",
    };

    const result = validateShellLocalizationCopy(copy);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "GITHUB_REPO_URL",
          message: "GITHUB_REPO_URL must be a valid absolute URL",
        }),
      ]),
    );
  });

  test("rejects non-https github repository URLs", () => {
    const copy = {
      ...getShellLocalizationCopy(),
      GITHUB_REPO_URL: "http://github.com/portpowered/you-agent-factory",
    };

    const result = validateShellLocalizationCopy(copy);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "GITHUB_REPO_URL",
          message: "GITHUB_REPO_URL must use https",
        }),
      ]),
    );
  });
});
