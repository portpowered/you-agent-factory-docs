import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listPublishedPublicContentRouteParams } from "../../src/lib/content";

const STARTER_CONTENT_ROOT = join(import.meta.dir, "../../src/content");

describe("listPublishedPublicContentRouteParams", () => {
  test("derives supported public route params from validated canonical starter records", () => {
    expect(listPublishedPublicContentRouteParams(STARTER_CONTENT_ROOT)).toEqual(
      [
        { kind: "blog", slug: "introducing-factory" },
        { kind: "comparison", slug: "vs-n8n" },
        { kind: "glossary", slug: "agent" },
        { kind: "reference", slug: "loop-engineering" },
      ],
    );
  });

  test("keeps the seam kind-aware so docs and unsupported kinds stay excluded", () => {
    const contentRoot = mkdtempSync(join(tmpdir(), "public-content-routes-"));

    mkdirSync(join(contentRoot, "docs", "getting-started"), {
      recursive: true,
    });
    mkdirSync(join(contentRoot, "blog", "published-post"), { recursive: true });
    mkdirSync(join(contentRoot, "references", "hidden-reference"), {
      recursive: true,
    });

    writeFileSync(
      join(contentRoot, "docs", "getting-started", "en.mdx"),
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

    writeFileSync(
      join(contentRoot, "blog", "published-post", "en.mdx"),
      `---
id: blog/published-post
kind: blog
title: Published post
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - blog
section: blog
order: 1
---

# Published post
`,
    );

    writeFileSync(
      join(contentRoot, "references", "hidden-reference", "en.mdx"),
      `---
id: reference/hidden-reference
kind: reference
title: Hidden reference
canonicalLocale: en
availableLocales:
  - en
status: hidden
tags:
  - reference
section: references
order: 1
---

# Hidden reference
`,
    );

    expect(listPublishedPublicContentRouteParams(contentRoot)).toEqual([
      { kind: "blog", slug: "published-post" },
    ]);
  });

  test("supports narrower kind filters without changing the canonical-record source", () => {
    expect(
      listPublishedPublicContentRouteParams(STARTER_CONTENT_ROOT, {
        supportedKinds: ["blog", "reference"],
      }),
    ).toEqual([
      { kind: "blog", slug: "introducing-factory" },
      { kind: "reference", slug: "loop-engineering" },
    ]);
  });
});
