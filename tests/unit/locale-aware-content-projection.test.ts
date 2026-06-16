import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  loadDocsShellNavigation,
  loadStarterContentRecords,
  projectLocaleAwareContent,
  projectLocaleAwareContentCatalog,
} from "../../src/lib/content";

const CONTENT_ROOT = join(import.meta.dir, "../../src/content");

describe("projectLocaleAwareContent", () => {
  test("projects direct localized-variant resolution with available locales", () => {
    const { records, variantBindings } =
      loadStarterContentRecords(CONTENT_ROOT);

    const projection = projectLocaleAwareContent("doc/getting-started", {
      requestedLocale: "fr",
      variantBindings,
    });

    expect(projection).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "fr",
      resolvedLocale: "fr",
      availableLocales: ["en", "fr"],
      fellBackToCanonicalLocale: false,
    });
  });

  test("projects canonical-locale fallback resolution with available locales", () => {
    const { variantBindings } = loadStarterContentRecords(CONTENT_ROOT);

    const projection = projectLocaleAwareContent("doc/getting-started", {
      requestedLocale: "ja",
      variantBindings,
    });

    expect(projection).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "ja",
      resolvedLocale: "en",
      availableLocales: ["en", "fr"],
      fellBackToCanonicalLocale: true,
    });
  });

  test("projects unsupported-locale fallback without inferring from file paths", () => {
    const { variantBindings } = loadStarterContentRecords(CONTENT_ROOT);

    const projection = projectLocaleAwareContent("doc/getting-started", {
      requestedLocale: "de",
      variantBindings,
    });

    expect(projection).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "de",
      resolvedLocale: "en",
      availableLocales: ["en", "fr"],
      fellBackToCanonicalLocale: true,
    });
  });
});

describe("projectLocaleAwareContentCatalog", () => {
  test("returns stable projections for each canonical page id", () => {
    const { records, variantBindings } =
      loadStarterContentRecords(CONTENT_ROOT);

    const catalog = projectLocaleAwareContentCatalog(records, {
      requestedLocale: "fr",
      variantBindings,
    });

    const gettingStarted = catalog.find(
      (entry) => entry.canonicalPageId === "doc/getting-started",
    );

    expect(gettingStarted).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "fr",
      resolvedLocale: "fr",
      availableLocales: ["en", "fr"],
      fellBackToCanonicalLocale: false,
    });
  });
});

describe("locale-aware projection integration", () => {
  test("docs-shell navigation exposes locale projection metadata on pages", () => {
    const navigation = loadDocsShellNavigation(CONTENT_ROOT, { locale: "fr" });
    const gettingStarted = navigation.sections
      .flatMap((section) => section.pages)
      .find((page) => page.canonicalId === "doc/getting-started");

    expect(gettingStarted?.localeProjection).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "fr",
      resolvedLocale: "fr",
      availableLocales: ["en", "fr"],
      fellBackToCanonicalLocale: false,
    });
  });
});
