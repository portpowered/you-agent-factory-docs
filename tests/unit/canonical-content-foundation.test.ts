import { describe, expect, test } from "bun:test";
import {
  projectDocsShellNavigation,
  validateContentMetadata,
  validateStarterContentSource,
} from "../../src/lib/content";

describe("canonical content foundation verification", () => {
  test("projects docs-shell navigation from validated starter metadata without shell constants", () => {
    const validation = validateStarterContentSource(
      "docs",
      "getting-started",
      "en",
      `---
id: doc/getting-started
kind: doc
title: Getting started
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - docs
section: guides
order: 1
---

# Getting started
`,
    );

    expect(validation.ok).toBe(true);
    if (!validation.ok) {
      throw new Error("expected starter content validation success");
    }

    const navigation = projectDocsShellNavigation([validation.record]);

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

  test("surfaces validation failures instead of partial canonical records or navigation", () => {
    const validation = validateContentMetadata({
      id: "doc/broken",
      kind: "doc",
      slug: "broken",
      canonicalLocale: "en",
      availableLocales: ["fr"],
      status: "published",
      tags: ["docs"],
      navigationTitle: "Broken page",
    });

    expect(validation.ok).toBe(false);
    if (validation.ok) {
      throw new Error("expected validation failure");
    }

    const navigation = projectDocsShellNavigation([]);

    expect(
      validation.errors.some((error) => error.field === "canonicalLocale"),
    ).toBe(true);
    expect(navigation.sections).toEqual([]);
  });

  test("keeps canonical record fields separate from projected docs-shell navigation shape", () => {
    const validation = validateContentMetadata({
      id: "doc/getting-started",
      kind: "doc",
      slug: "getting-started",
      canonicalLocale: "en",
      availableLocales: ["en", "en-US"],
      status: "published",
      tags: ["docs"],
      navigationTitle: "Getting started",
      section: "guides",
      order: 1,
      search: { include: true, priority: 10 },
    });

    expect(validation.ok).toBe(true);
    if (!validation.ok) {
      throw new Error("expected validation success");
    }

    const navigation = projectDocsShellNavigation([validation.record]);

    expect(validation.record).toEqual(
      expect.objectContaining({
        id: "doc/getting-started",
        canonicalLocale: "en",
        availableLocales: ["en", "en-US"],
        searchInclude: true,
        searchPriority: 10,
      }),
    );
    expect(navigation).toEqual({
      sections: [
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
      ],
    });
    expect(navigation.sections[0]?.pages[0]).not.toHaveProperty(
      "canonicalLocale",
    );
    expect(navigation.sections[0]?.pages[0]).not.toHaveProperty(
      "availableLocales",
    );
  });
});
