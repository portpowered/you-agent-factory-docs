import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  PublicContentPageNotFoundError,
  loadPublicContentPage,
} from "../../src/lib/content";

const STARTER_CONTENT_ROOT = join(import.meta.dir, "../../src/content");

describe("loadPublicContentPage", () => {
  test.each([
    {
      kind: "blog",
      slug: "introducing-factory",
      title: "Introducing You Agent Factory",
      routePath: "/blog/introducing-factory",
      bodyText: "Starter blog content for the shared canonical model.",
      section: "updates",
    },
    {
      kind: "glossary",
      slug: "agent",
      title: "Agent",
      routePath: "/glossary/agent",
      bodyText:
        "An agent in You Agent Factory is a named worker inside a workflow.",
      section: "terms",
    },
    {
      kind: "comparison",
      slug: "vs-n8n",
      title: "You Agent Factory vs n8n",
      routePath: "/comparisons/vs-n8n",
      bodyText:
        "You Agent Factory and n8n both help teams automate repeatable work, but they optimize for different operating models.",
      section: "comparisons",
    },
    {
      kind: "reference",
      slug: "loop-engineering",
      title: "Loop engineering",
      routePath: "/references/loop-engineering",
      bodyText:
        "Loop engineering is the practice of designing the feedback cycle around an agent workflow instead of treating a run as one irreversible shot.",
      section: "references",
    },
  ])(
    "loads the published $kind starter page from canonical content records",
    ({ bodyText, kind, routePath, section, slug, title }) => {
      const page = loadPublicContentPage(kind, slug, STARTER_CONTENT_ROOT);

      expect(page.record.id).toBe(`${kind}/${slug}`);
      expect(page.record.routePath).toBe(routePath);
      expect(page.record.section).toBe(section);
      expect(page.title).toBe(title);
      expect(page.body).toContain(bodyText);
      expect(page.resolution).toEqual({
        canonicalPageId: `${kind}/${slug}`,
        canonicalLocale: "en",
        requestedLocale: "en",
        resolvedLocale: "en",
        fellBackToCanonicalLocale: false,
      });
    },
  );

  test("throws a public-content not-found error for an unknown slug", () => {
    expect(() =>
      loadPublicContentPage("blog", "missing-post", STARTER_CONTENT_ROOT),
    ).toThrow(PublicContentPageNotFoundError);
  });

  test("treats hidden public content as not found", () => {
    const contentRoot = mkdtempSync(join(tmpdir(), "hidden-public-content-"));
    const hiddenReferenceDir = join(contentRoot, "references", "hidden-entry");

    mkdirSync(hiddenReferenceDir, { recursive: true });
    writeFileSync(
      join(hiddenReferenceDir, "en.mdx"),
      `---
id: reference/hidden-entry
kind: reference
title: Hidden entry
canonicalLocale: en
availableLocales:
  - en
status: hidden
tags:
  - reference
section: references
order: 1
---

Hidden entry content.
`,
    );

    expect(() =>
      loadPublicContentPage("reference", "hidden-entry", contentRoot),
    ).toThrow(PublicContentPageNotFoundError);
  });
});
