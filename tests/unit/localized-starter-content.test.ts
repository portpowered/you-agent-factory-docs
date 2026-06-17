import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  listPublishedDocSlugs,
  loadStarterContentRecords,
  projectDocsShellNavigation,
} from "../../src/lib/content";

const CONTENT_ROOT = join(import.meta.dir, "../../src/content");

describe("localized starter content variants", () => {
  test("loads parallel doc locale variants that share one canonical page id", () => {
    const { records, failures, localizedVariantGroups } =
      loadStarterContentRecords(CONTENT_ROOT);

    expect(failures).toEqual([]);

    const gettingStartedRecords = records.filter(
      (record) => record.id === "doc/getting-started",
    );
    expect(gettingStartedRecords).toHaveLength(2);
    expect(
      gettingStartedRecords.every(
        (record) =>
          record.id === "doc/getting-started" &&
          record.canonicalLocale === "en" &&
          record.availableLocales.join(",") === "en,fr" &&
          record.routePath === "/docs/getting-started",
      ),
    ).toBe(true);
    expect(
      new Set(gettingStartedRecords.map((record) => record.slug)).size,
    ).toBe(1);
  });

  test("exposes reviewer-visible localized variant group metadata for parallel variants", () => {
    const { localizedVariantGroups } = loadStarterContentRecords(CONTENT_ROOT);

    const gettingStartedGroup = localizedVariantGroups.find(
      (group) => group.canonicalPageId === "doc/getting-started",
    );

    expect(gettingStartedGroup).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      variants: [
        expect.objectContaining({
          canonicalPageId: "doc/getting-started",
          canonicalLocale: "en",
          variantLocale: "en",
          availableLocales: ["en", "fr"],
        }),
        expect.objectContaining({
          canonicalPageId: "doc/getting-started",
          canonicalLocale: "en",
          variantLocale: "fr",
          availableLocales: ["en", "fr"],
        }),
      ],
    });
  });

  test("does not duplicate public doc routes for parallel locale variants", () => {
    const { records, variantBindings } =
      loadStarterContentRecords(CONTENT_ROOT);

    expect(listPublishedDocSlugs(CONTENT_ROOT)).toEqual([
      "concepts",
      "configuration",
      "getting-started",
      "installation",
    ]);

    const navigation = projectDocsShellNavigation(records, { variantBindings });
    const gettingStartedPages = navigation.sections
      .flatMap((section) => section.pages)
      .filter((page) => page.canonicalId === "doc/getting-started");

    expect(gettingStartedPages).toEqual([
      {
        canonicalId: "doc/getting-started",
        label: "Getting started",
        href: "/docs/getting-started",
        order: 1,
        localeProjection: {
          canonicalPageId: "doc/getting-started",
          canonicalLocale: "en",
          requestedLocale: "en",
          resolvedLocale: "en",
          availableLocales: ["en", "fr"],
          fellBackToCanonicalLocale: false,
        },
      },
    ]);
  });
});
