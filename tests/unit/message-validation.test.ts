import { describe, expect, test } from "bun:test";
import { DEFAULT_LOCALE } from "../../src/localization/config/default-locale";
import { resolveLocale } from "../../src/localization/lib/resolve-locale";
import {
  assertValidRegisteredMessageCatalogs,
  collectSharedShellMessageKeys,
  validateDefaultLocaleMessages,
  validatePartialLocaleMessages,
  validateRegisteredMessageCatalogs,
  validateUnsupportedLocaleResolution,
} from "../../src/localization/lib/validate-messages";
import { enMessages } from "../../src/localization/messages/en";
import { frMessages } from "../../src/localization/messages/fr";

describe("shared shell message validation", () => {
  test("collects every required key from the default locale contract", () => {
    const keys = collectSharedShellMessageKeys(enMessages);

    expect(keys).toContain("common.getStarted");
    expect(keys).toContain("landing.primaryNavAriaLabel");
    expect(keys).toContain("shell.openMenuLabel");
    expect(keys.length).toBeGreaterThan(0);
  });

  test("registered default and secondary catalogs pass validation", () => {
    const result = validateRegisteredMessageCatalogs();

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(() => assertValidRegisteredMessageCatalogs()).not.toThrow();
  });

  test("fails when the default locale catalog is missing required keys", () => {
    const brokenDefault = {
      common: {
        getStarted: "Get started",
      },
    };

    const result = validateDefaultLocaleMessages(brokenDefault);

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.key === "docs.navHeading")).toBe(
      true,
    );
  });

  test("fails when the default locale catalog has malformed empty strings", () => {
    const malformedDefault = {
      ...enMessages,
      common: {
        ...enMessages.common,
        getStarted: "   ",
      },
    };

    const result = validateDefaultLocaleMessages(malformedDefault);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        key: "common.getStarted",
        message: expect.stringContaining("non-empty string"),
      }),
    ]);
  });

  test("allows partial secondary locale catalogs with missing keys", () => {
    const result = validatePartialLocaleMessages(frMessages, enMessages, "fr");

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("fails when a secondary locale catalog has incompatible shape", () => {
    const incompatiblePartial = {
      common: {
        getStarted: { label: "Commencer" },
      },
    };

    const result = validatePartialLocaleMessages(
      incompatiblePartial,
      enMessages,
      "fr",
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        locale: "fr",
        key: "common.getStarted",
        message: expect.stringContaining("Expected string"),
      }),
    ]);
  });

  test("fails when a secondary locale catalog defines unknown keys", () => {
    const unknownKeyPartial = {
      common: {
        getStarted: "Commencer",
        unexpectedKey: "Surprise",
      },
    };

    const result = validatePartialLocaleMessages(
      unknownKeyPartial,
      enMessages,
      "fr",
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        key: "common.unexpectedKey",
        message: expect.stringContaining("Unknown shared shell message key"),
      }),
    ]);
  });

  test("assertValidRegisteredMessageCatalogs throws with issue details for broken catalogs", () => {
    const brokenDefault = { common: { getStarted: "Get started" } };
    const result = validateDefaultLocaleMessages(brokenDefault);

    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toMatch(
      /Missing required shared shell message key/,
    );
  });
});

describe("unsupported locale handling for message validation", () => {
  test("normalizes unsupported locale inputs before catalog lookup", () => {
    const resolution = resolveLocale("de");

    expect(resolution.locale).toBe(DEFAULT_LOCALE);
    expect(resolution.normalized).toBe(true);
  });

  test("keeps fallback catalog valid after unsupported locale resolution", () => {
    const result = validateUnsupportedLocaleResolution("de");

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("surfaces fallback breakage when default catalog would be incomplete", () => {
    const brokenDefault = { common: { getStarted: "Get started" } };
    const fallbackResult = validateDefaultLocaleMessages(brokenDefault);

    expect(fallbackResult.valid).toBe(false);
    expect(fallbackResult.issues.length).toBeGreaterThan(0);
  });
});
