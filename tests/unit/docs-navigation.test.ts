import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type CanonicalContentRecord,
  StarterContentValidationError,
  loadDocsShellNavigation,
  projectDocsBreadcrumbs,
  projectDocsProgression,
  projectDocsShellNavigation,
  requireStarterContentRecords,
} from "../../src/lib/content";

const CONTENT_ROOT = join(import.meta.dir, "../../src/content");

function createDocRecord(
  overrides: Partial<CanonicalContentRecord> = {},
): CanonicalContentRecord {
  return {
    id: "doc/introduction",
    kind: "doc",
    slug: "introduction",
    routePath: "/docs/introduction",
    section: "setup",
    tags: ["docs"],
    status: "published",
    order: 0,
    canonicalLocale: "en",
    availableLocales: ["en"],
    searchInclude: true,
    navigationTitle: "Introduction",
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
        id: "setup",
        label: "Setup",
        pages: [
          {
            canonicalId: "doc/introduction",
            label: "Introduction",
            href: "/docs/introduction",
            order: 0,
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
      createDocRecord({
        id: "doc/getting-started",
        slug: "getting-started",
        routePath: "/docs/getting-started",
        section: "guides",
        navigationTitle: "Getting started",
        order: 1,
      }),
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
      createDocRecord({
        id: "doc/getting-started",
        slug: "getting-started",
        routePath: "/docs/getting-started",
        section: "guides",
        navigationTitle: "Getting started",
        order: 5,
      }),
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
      id: "doc/introduction",
      slug: "introduction",
      routePath: "/docs/introduction",
      navigationTitle: "Introduction",
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
        canonicalId: "doc/introduction",
        label: "Introduction",
        href: "/docs/introduction",
      }),
      expect.objectContaining({
        canonicalId: "doc/multilingual",
        label: "Multilingual guide",
        href: "/docs/multilingual",
      }),
    ]);
    expect(
      frenchNavigation.sections
        .flatMap((section) => section.pages)
        .map((page) => page.canonicalId),
    ).toEqual(["doc/guide-fr", "doc/multilingual"]);
  });

  test("deduplicates locale variants that share one canonical identity", () => {
    const navigation = projectDocsShellNavigation([
      createDocRecord({
        id: "doc/introduction",
        navigationTitle: "Introduction",
        canonicalLocale: "en",
        availableLocales: ["en"],
        order: 0,
      }),
      createDocRecord({
        id: "doc/introduction",
        navigationTitle: "Introduction (US)",
        canonicalLocale: "en-US",
        availableLocales: ["en-US"],
        order: 2,
      }),
    ]);

    expect(navigation.sections).toEqual([
      {
        id: "setup",
        label: "Setup",
        pages: [
          {
            canonicalId: "doc/introduction",
            label: "Introduction",
            href: "/docs/introduction",
            order: 0,
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
        id: "setup",
        label: "Setup",
        pages: [
          {
            canonicalId: "doc/introduction",
            label: "Introduction",
            href: "/docs/introduction",
            order: 0,
            localeProjection: {
              canonicalPageId: "doc/introduction",
              canonicalLocale: "en",
              requestedLocale: "en",
              resolvedLocale: "en",
              availableLocales: ["en"],
              fellBackToCanonicalLocale: false,
            },
          },
          {
            canonicalId: "doc/installation",
            label: "Installation",
            href: "/docs/installation",
            order: 1,
            localeProjection: {
              canonicalPageId: "doc/installation",
              canonicalLocale: "en",
              requestedLocale: "en",
              resolvedLocale: "en",
              availableLocales: ["en"],
              fellBackToCanonicalLocale: false,
            },
          },
          {
            canonicalId: "doc/quickstart",
            label: "Quickstart",
            href: "/docs/quickstart",
            order: 2,
            localeProjection: {
              canonicalPageId: "doc/quickstart",
              canonicalLocale: "en",
              requestedLocale: "en",
              resolvedLocale: "en",
              availableLocales: ["en"],
              fellBackToCanonicalLocale: false,
            },
          },
          {
            canonicalId: "doc/configuration",
            label: "Configuration",
            href: "/docs/configuration",
            order: 3,
            localeProjection: {
              canonicalPageId: "doc/configuration",
              canonicalLocale: "en",
              requestedLocale: "en",
              resolvedLocale: "en",
              availableLocales: ["en"],
              fellBackToCanonicalLocale: false,
            },
          },
        ],
      },
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
          {
            canonicalId: "doc/concepts",
            label: "Core concepts",
            href: "/docs/concepts",
            order: 2,
            localeProjection: {
              canonicalPageId: "doc/concepts",
              canonicalLocale: "en",
              requestedLocale: "en",
              resolvedLocale: "en",
              availableLocales: ["en"],
              fellBackToCanonicalLocale: false,
            },
          },
        ],
      },
      {
        id: "examples",
        label: "Examples",
        pages: [
          {
            canonicalId: "doc/examples/code-presentation",
            label: "Code presentation",
            href: "/docs/examples/code-presentation",
            order: 1,
          },
        ],
      },
    ]);
  });

  test("keeps canonical pages in locale-aware navigation when falling back to canonical locale", () => {
    for (const locale of ["ja", "de"] as const) {
      const navigation = loadDocsShellNavigation(CONTENT_ROOT, { locale });
      const gettingStarted = navigation.sections
        .flatMap((section) => section.pages)
        .find((page) => page.canonicalId === "doc/getting-started");

      expect(gettingStarted).toEqual({
        canonicalId: "doc/getting-started",
        label: "Getting started",
        href: "/docs/getting-started",
        order: 1,
        localeProjection: {
          canonicalPageId: "doc/getting-started",
          canonicalLocale: "en",
          requestedLocale: locale,
          resolvedLocale: "en",
          availableLocales: ["en", "fr"],
          fellBackToCanonicalLocale: true,
        },
      });
    }
  });

  test("exposes multi-section docs browsing depth from canonical metadata", () => {
    const navigation = loadDocsShellNavigation(CONTENT_ROOT);
    const sectionIds = navigation.sections.map((section) => section.id);
    const pageCount = navigation.sections.reduce(
      (total, section) => total + section.pages.length,
      0,
    );

    expect(sectionIds).toEqual(["setup", "guides", "examples"]);
    expect(pageCount).toBeGreaterThanOrEqual(7);
    expect(
      navigation.sections.some(
        (section) =>
          section.id === "setup" &&
          section.pages.map((page) => page.canonicalId).join(",") ===
            "doc/introduction,doc/installation,doc/quickstart,doc/configuration",
      ),
    ).toBe(true);
  });
});

describe("docs breadcrumb projection", () => {
  test("projects docs entry position as a single current-page crumb", () => {
    const navigation = projectDocsShellNavigation([createDocRecord()]);

    expect(
      projectDocsBreadcrumbs(navigation, {
        currentPath: "/docs",
        docsRootLabel: "Documentation",
      }),
    ).toEqual({
      items: [{ label: "Documentation" }],
    });
  });

  test("projects section and page ancestry for generated docs detail routes", () => {
    const navigation = projectDocsShellNavigation([
      createDocRecord({
        id: "doc/getting-started",
        slug: "getting-started",
        routePath: "/docs/getting-started",
        section: "guides",
        navigationTitle: "Getting started",
        order: 1,
      }),
      createDocRecord({
        id: "doc/concepts",
        slug: "concepts",
        routePath: "/docs/concepts",
        section: "guides",
        navigationTitle: "Core concepts",
        order: 2,
      }),
    ]);

    expect(
      projectDocsBreadcrumbs(navigation, {
        currentPath: "/docs/getting-started",
        docsRootLabel: "Documentation",
      }),
    ).toEqual({
      items: [
        { label: "Documentation", href: "/docs" },
        { label: "Guides" },
        { label: "Getting started" },
      ],
    });
  });

  test("updates breadcrumb ancestry when canonical section metadata changes", () => {
    const navigation = projectDocsShellNavigation([
      createDocRecord({
        id: "doc/installation",
        slug: "installation",
        routePath: "/docs/installation",
        navigationTitle: "Installation",
        section: "setup",
        order: 1,
      }),
    ]);

    expect(
      projectDocsBreadcrumbs(navigation, {
        currentPath: "/docs/installation",
        docsRootLabel: "Documentation",
      }),
    ).toEqual({
      items: [
        { label: "Documentation", href: "/docs" },
        { label: "Setup" },
        { label: "Installation" },
      ],
    });
  });
});

describe("docs progression projection", () => {
  const multiSectionNavigation = projectDocsShellNavigation([
    createDocRecord(),
    createDocRecord({
      id: "doc/installation",
      slug: "installation",
      routePath: "/docs/installation",
      navigationTitle: "Installation",
      section: "setup",
      order: 1,
    }),
    createDocRecord({
      id: "doc/quickstart",
      slug: "quickstart",
      routePath: "/docs/quickstart",
      navigationTitle: "Quickstart",
      section: "setup",
      order: 2,
    }),
    createDocRecord({
      id: "doc/configuration",
      slug: "configuration",
      routePath: "/docs/configuration",
      navigationTitle: "Configuration",
      section: "setup",
      order: 3,
    }),
    createDocRecord({
      id: "doc/concepts",
      slug: "concepts",
      routePath: "/docs/concepts",
      section: "guides",
      navigationTitle: "Core concepts",
      order: 2,
    }),
    createDocRecord({
      id: "doc/getting-started",
      slug: "getting-started",
      routePath: "/docs/getting-started",
      section: "guides",
      navigationTitle: "Getting started",
      order: 1,
    }),
  ]);

  test("projects next progression from docs entry to the first generated page", () => {
    expect(
      projectDocsProgression(multiSectionNavigation, {
        currentPath: "/docs",
      }),
    ).toEqual({
      next: {
        label: "Introduction",
        href: "/docs/introduction",
      },
    });
  });

  test("projects previous and next links from flattened docs navigation ordering", () => {
    expect(
      projectDocsProgression(multiSectionNavigation, {
        currentPath: "/docs/concepts",
      }),
    ).toEqual({
      previous: {
        label: "Getting started",
        href: "/docs/getting-started",
      },
      next: undefined,
    });
  });

  test("omits previous on the first page and next on the last page", () => {
    expect(
      projectDocsProgression(multiSectionNavigation, {
        currentPath: "/docs/introduction",
      }),
    ).toEqual({
      next: {
        label: "Installation",
        href: "/docs/installation",
      },
    });

    expect(
      projectDocsProgression(multiSectionNavigation, {
        currentPath: "/docs/concepts",
      }),
    ).toEqual({
      previous: {
        label: "Getting started",
        href: "/docs/getting-started",
      },
      next: undefined,
    });
  });

  test("updates progression when canonical section or order metadata changes", () => {
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

    expect(
      projectDocsProgression(reordered, {
        currentPath: "/docs/introduction",
      }),
    ).toEqual({
      previous: {
        label: "Installation",
        href: "/docs/installation",
      },
      next: undefined,
    });
  });
});
