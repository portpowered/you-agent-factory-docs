import { describe, expect, test } from "bun:test";
import { DOCS_ENTRY_ROUTE } from "../../src/lib/site";
import {
  DEFAULT_LOCALE,
  LOCALE_REGISTRY,
  SUPPORTED_LOCALES,
  createCanonicalPageIdentity,
  getContentVariantLocales,
  isDefaultLocale,
  isSupportedLocale,
  resolveLocale,
} from "../../src/localization";

describe("locale registry", () => {
  test("defines one default locale used by the shared message path", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
    expect(isDefaultLocale(DEFAULT_LOCALE)).toBe(true);
  });

  test("registers every supported locale with display metadata", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_REGISTRY[locale].label.length).toBeGreaterThan(0);
      expect(LOCALE_REGISTRY[locale].nativeLabel.length).toBeGreaterThan(0);
    }
  });

  test("exposes the same locale set for future content variants", () => {
    expect(getContentVariantLocales()).toEqual(SUPPORTED_LOCALES);
  });
});

describe("resolveLocale", () => {
  test("accepts supported locale tags without normalization", () => {
    expect(resolveLocale("fr")).toEqual({ locale: "fr", normalized: false });
    expect(resolveLocale("EN")).toEqual({ locale: "en", normalized: false });
  });

  test("normalizes unsupported locale inputs to the default locale", () => {
    expect(resolveLocale("de")).toEqual({
      locale: DEFAULT_LOCALE,
      normalized: true,
      requested: "de",
    });
    expect(resolveLocale("")).toEqual({
      locale: DEFAULT_LOCALE,
      normalized: true,
      requested: "",
    });
    expect(resolveLocale(undefined)).toEqual({
      locale: DEFAULT_LOCALE,
      normalized: true,
      requested: "",
    });
  });

  test("rejects ad hoc locale tags through the supported-locale guard", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("en-US")).toBe(false);
    expect(isSupportedLocale("de")).toBe(false);
  });
});

describe("canonical page identity", () => {
  test("keeps stable routes such as / and /docs without locale prefixes", () => {
    const home = createCanonicalPageIdentity("/", SUPPORTED_LOCALES);
    const docs = createCanonicalPageIdentity(
      DOCS_ENTRY_ROUTE,
      SUPPORTED_LOCALES,
    );

    expect(home.route).toBe("/");
    expect(docs.route).toBe("/docs");
    expect(docs.route).not.toMatch(/^\/[a-z]{2}\//);
    expect(home.availableLocales).toEqual(SUPPORTED_LOCALES);
  });

  test("rejects locale-prefixed route identities", () => {
    expect(() =>
      createCanonicalPageIdentity("/en/docs", SUPPORTED_LOCALES),
    ).toThrow(/locale prefixes/i);
    expect(() => createCanonicalPageIdentity("/fr", SUPPORTED_LOCALES)).toThrow(
      /locale prefixes/i,
    );
  });
});
