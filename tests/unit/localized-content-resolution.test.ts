import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  loadStarterContentRecords,
  resolveLocalizedContentVariant,
  selectLocalizedVariantBinding,
} from "../../src/lib/content";

const CONTENT_ROOT = join(import.meta.dir, "../../src/content");

describe("resolveLocalizedContentVariant", () => {
  test("resolves a direct localized variant for a supported requested locale", () => {
    const { variantBindings } = loadStarterContentRecords(CONTENT_ROOT);

    const resolution = resolveLocalizedContentVariant("doc/getting-started", {
      requestedLocale: "fr",
      variantBindings,
    });

    expect(resolution).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "fr",
      resolvedLocale: "fr",
      fellBackToCanonicalLocale: false,
    });
  });

  test("falls back to the canonical locale when a supported locale has no variant", () => {
    const { variantBindings } = loadStarterContentRecords(CONTENT_ROOT);

    const resolution = resolveLocalizedContentVariant("doc/getting-started", {
      requestedLocale: "ja",
      variantBindings,
    });

    expect(resolution).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "ja",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: true,
    });
  });

  test("falls back to the canonical locale for unsupported requested locales", () => {
    const { variantBindings } = loadStarterContentRecords(CONTENT_ROOT);

    const resolution = resolveLocalizedContentVariant("doc/getting-started", {
      requestedLocale: "de",
      variantBindings,
    });

    expect(resolution).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "de",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: true,
    });
  });

  test("defaults to the canonical locale when no locale is requested", () => {
    const { variantBindings } = loadStarterContentRecords(CONTENT_ROOT);

    const resolution = resolveLocalizedContentVariant("doc/getting-started", {
      variantBindings,
    });

    expect(resolution).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "en",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: false,
    });
  });

  test("selects the binding that matches the resolved locale", () => {
    const { variantBindings } = loadStarterContentRecords(CONTENT_ROOT);

    const binding = selectLocalizedVariantBinding(
      variantBindings,
      "doc/getting-started",
      "fr",
    );

    expect(binding?.variantLocale).toBe("fr");
    expect(binding?.record.navigationTitle).toBe("Commencer");
  });
});
