import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  type CanonicalContentRecord,
  loadDocsShellNavigation,
  projectDocsShellNavigation,
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
          },
        ],
      },
    ]);
  });
});
