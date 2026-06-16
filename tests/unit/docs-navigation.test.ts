import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type CanonicalContentRecord,
  StarterContentValidationError,
  loadDocsShellNavigation,
  projectDocsShellNavigation,
  requireStarterContentRecords,
} from "../../src/lib/content";

const CONTENT_ROOT = join(import.meta.dir, "../../src/content");

function createDocRecord(
  overrides: Partial<CanonicalContentRecord> = {},
): CanonicalContentRecord {
  return {
    id: "doc/getting-started",
    kind: "doc",
    slug: "getting-started",
    routePath: "/docs/getting-started",
    section: "guides",
    tags: ["docs"],
    status: "published",
    order: 1,
    canonicalLocale: "en",
    availableLocales: ["en"],
    searchInclude: true,
    navigationTitle: "Getting started",
    ...overrides,
  };
}

describe("docs shell navigation projection", () => {
  test("groups published doc records into ordered sections and page labels", () => {
    const navigation = projectDocsShellNavigation([
      createDocRecord({
        id: "doc/installation",
        slug: "installation",
        routePath: "/docs/installation",
        navigationTitle: "Installation",
        order: 2,
      }),
      createDocRecord(),
      createDocRecord({
        id: "blog/introducing-factory",
        kind: "blog",
        slug: "introducing-factory",
        routePath: "/blog/introducing-factory",
        navigationTitle: "Introducing factory",
      }),
      createDocRecord({
        id: "doc/draft-page",
        slug: "draft-page",
        routePath: "/docs/draft-page",
        navigationTitle: "Draft page",
        status: "draft",
      }),
    ]);

    expect(navigation.sections).toEqual([
      {
        id: "guides",
        label: "Guides",
        pages: [
          {
            canonicalId: "doc/getting-started",
            label: "Getting started",
            href: "/docs/getting-started",
            order: 1,
          },
          {
            canonicalId: "doc/installation",
            label: "Installation",
            href: "/docs/installation",
            order: 2,
          },
        ],
      },
    ]);
  });

  test("changes section order and page order when canonical metadata changes", () => {
    const baseline = projectDocsShellNavigation([
      createDocRecord({
        id: "doc/installation",
        slug: "installation",
        routePath: "/docs/installation",
        navigationTitle: "Installation",
        section: "setup",
        order: 2,
      }),
      createDocRecord(),
    ]);

    const reordered = projectDocsShellNavigation([
      createDocRecord({
        id: "doc/installation",
        slug: "installation",
        routePath: "/docs/installation",
        navigationTitle: "Installation",
        section: "setup",
        order: 0,
      }),
      createDocRecord({ order: 5 }),
    ]);

    expect(baseline.sections.map((section) => section.id)).toEqual([
      "guides",
      "setup",
    ]);
    expect(reordered.sections.map((section) => section.id)).toEqual([
      "setup",
      "guides",
    ]);
    expect(reordered.sections[0]?.pages[0]?.label).toBe("Installation");
  });

  test("filters projected navigation to locale availability while keeping canonical ids", () => {
    const englishOnly = createDocRecord({
      id: "doc/getting-started",
      slug: "getting-started",
      routePath: "/docs/getting-started",
      navigationTitle: "Getting started",
      canonicalLocale: "en",
      availableLocales: ["en"],
    });
    const frenchOnly = createDocRecord({
      id: "doc/guide-fr",
      slug: "guide-fr",
      routePath: "/docs/guide-fr",
      navigationTitle: "Guide FR",
      canonicalLocale: "fr",
      availableLocales: ["fr"],
    });
    const multilingual = createDocRecord({
      id: "doc/multilingual",
      slug: "multilingual",
      routePath: "/docs/multilingual",
      navigationTitle: "Multilingual guide",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      order: 0,
    });

    const englishNavigation = projectDocsShellNavigation(
      [englishOnly, frenchOnly, multilingual],
      { locale: "en" },
    );
    const frenchNavigation = projectDocsShellNavigation(
      [englishOnly, frenchOnly, multilingual],
      { locale: "fr" },
    );

    expect(
      englishNavigation.sections.flatMap((section) => section.pages),
    ).toEqual([
      expect.objectContaining({
        canonicalId: "doc/multilingual",
        label: "Multilingual guide",
        href: "/docs/multilingual",
      }),
      expect.objectContaining({
        canonicalId: "doc/getting-started",
        label: "Getting started",
        href: "/docs/getting-started",
      }),
    ]);
    expect(
      frenchNavigation.sections
        .flatMap((section) => section.pages)
        .map((page) => page.canonicalId),
    ).toEqual(["doc/multilingual", "doc/guide-fr"]);
  });

  test("deduplicates locale variants that share one canonical identity", () => {
    const navigation = projectDocsShellNavigation([
      createDocRecord({
        id: "doc/getting-started",
        navigationTitle: "Getting started",
        canonicalLocale: "en",
        availableLocales: ["en"],
        order: 1,
      }),
      createDocRecord({
        id: "doc/getting-started",
        navigationTitle: "Getting started (US)",
        canonicalLocale: "en-US",
        availableLocales: ["en-US"],
        order: 2,
      }),
    ]);

    expect(navigation.sections).toEqual([
      {
        id: "guides",
        label: "Guides",
        pages: [
          {
            canonicalId: "doc/getting-started",
            label: "Getting started",
            href: "/docs/getting-started",
            order: 1,
          },
        ],
      },
    ]);
  });

  test("blocks docs navigation generation when starter content validation fails", () => {
    const contentRoot = mkdtempSync(join(tmpdir(), "invalid-starter-content-"));
    const fixtureDir = join(contentRoot, "docs", "invalid-fixture");
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      join(fixtureDir, "en.mdx"),
      `---
id: doc/invalid-fixture
kind: doc
title: Invalid fixture
canonicalLocale: en
availableLocales:
  - fr
status: archived
tags:
  - docs
section: guides
---

# Invalid fixture
`,
    );

    expect(() => requireStarterContentRecords(contentRoot)).toThrow(
      StarterContentValidationError,
    );
    expect(() => loadDocsShellNavigation(contentRoot)).toThrow(
      StarterContentValidationError,
    );
  });

  test("loads generated navigation from starter content fixtures", () => {
    const navigation = loadDocsShellNavigation(CONTENT_ROOT);

    expect(navigation.sections).toEqual([
      {
        id: "guides",
        label: "Guides",
        pages: [
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
        ],
      },
    ]);
  });
});
