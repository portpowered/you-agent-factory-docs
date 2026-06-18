import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadDocPage } from "../../src/lib/content";

const STARTER_CONTENT_ROOT = join(import.meta.dir, "../../src/content");

describe("loadDocPage", () => {
  test("loads canonical setup-path pages with stable doc identity and canonical-locale metadata", () => {
    const setupPages = [
      {
        slug: "introduction",
        canonicalId: "doc/introduction",
        title: "Introduction",
        bodySnippet:
          "You Agent Factory is an open-source, engineering-native platform",
      },
      {
        slug: "installation",
        canonicalId: "doc/installation",
        title: "Installation",
        bodySnippet:
          "Run `make check`, `make test`, and `make build` after setup",
      },
      {
        slug: "quickstart",
        canonicalId: "doc/quickstart",
        title: "Quickstart",
        bodySnippet: "Run `bun run dev` from the repository root.",
      },
      {
        slug: "coder-reviewer-pattern",
        canonicalId: "doc/coder-reviewer-pattern",
        title: "Coder / Reviewer pattern",
        bodySnippet: "approval is treated as a real gate",
      },
    ] as const;

    for (const setupPage of setupPages) {
      const page = loadDocPage(setupPage.slug, STARTER_CONTENT_ROOT, {
        locale: "en",
      });

      expect(page.record).toMatchObject({
        id: setupPage.canonicalId,
        slug: setupPage.slug,
        routePath: `/docs/${setupPage.slug}`,
        canonicalLocale: "en",
        availableLocales: ["en"],
        status: "published",
      });
      expect(page.title).toBe(setupPage.title);
      expect(page.body).toContain(setupPage.bodySnippet);
      expect(page.resolution).toEqual({
        canonicalPageId: setupPage.canonicalId,
        canonicalLocale: "en",
        requestedLocale: "en",
        resolvedLocale: "en",
        fellBackToCanonicalLocale: false,
      });
      expect(page.localeProjection).toEqual({
        canonicalPageId: setupPage.canonicalId,
        canonicalLocale: "en",
        requestedLocale: "en",
        resolvedLocale: "en",
        availableLocales: ["en"],
        fellBackToCanonicalLocale: false,
      });
    }
  });

  test("serves accepted plain markdown locale files through the docs page path", () => {
    const contentRoot = mkdtempSync(join(tmpdir(), "plain-markdown-doc-"));
    const fixtureDir = join(contentRoot, "docs", "plain-markdown");
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      join(fixtureDir, "en.md"),
      `---
id: doc/plain-markdown
kind: doc
title: Plain markdown
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - docs
section: guides
order: 1
---

Plain markdown body content.
`,
    );

    const page = loadDocPage("plain-markdown", contentRoot);

    expect(page.record.id).toBe("doc/plain-markdown");
    expect(page.title).toBe("Plain markdown");
    expect(page.body).toContain("Plain markdown body content.");
  });

  test("prefers mdx locale files when both markdown extensions exist", () => {
    const contentRoot = mkdtempSync(join(tmpdir(), "dual-extension-doc-"));
    const fixtureDir = join(contentRoot, "docs", "dual-extension");
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      join(fixtureDir, "en.md"),
      `---
id: doc/dual-extension
kind: doc
title: Markdown copy
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - docs
section: guides
order: 1
---

Markdown body.
`,
    );
    writeFileSync(
      join(fixtureDir, "en.mdx"),
      `---
id: doc/dual-extension
kind: doc
title: MDX copy
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - docs
section: guides
order: 1
---

MDX body.
`,
    );

    const page = loadDocPage("dual-extension", contentRoot);

    expect(page.title).toBe("MDX copy");
    expect(page.body).toContain("MDX body.");
  });

  test("serves the localized variant for a supported requested locale", () => {
    const page = loadDocPage("getting-started", STARTER_CONTENT_ROOT, {
      locale: "fr",
    });

    expect(page.record.routePath).toBe("/docs/getting-started");
    expect(page.title).toBe("Commencer");
    expect(page.body).toContain("identité de contenu localisé partagée");
    expect(page.resolution).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "fr",
      resolvedLocale: "fr",
      fellBackToCanonicalLocale: false,
    });
    expect(page.localeProjection).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "fr",
      resolvedLocale: "fr",
      availableLocales: ["en", "fr"],
      fellBackToCanonicalLocale: false,
    });
  });

  test("falls back to canonical-locale content for supported locales without variants", () => {
    const page = loadDocPage("getting-started", STARTER_CONTENT_ROOT, {
      locale: "ja",
    });

    expect(page.record.routePath).toBe("/docs/getting-started");
    expect(page.title).toBe("Getting started");
    expect(page.body).toContain("canonical content model");
    expect(page.resolution).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "ja",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: true,
    });
    expect(page.localeProjection.availableLocales).toEqual(["en", "fr"]);
    expect(page.localeProjection.fellBackToCanonicalLocale).toBe(true);
  });

  test("falls back to canonical-locale content for unsupported locales", () => {
    const page = loadDocPage("getting-started", STARTER_CONTENT_ROOT, {
      locale: "de",
    });

    expect(page.record.routePath).toBe("/docs/getting-started");
    expect(page.title).toBe("Getting started");
    expect(page.resolution).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      requestedLocale: "de",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: true,
    });
    expect(page.localeProjection.availableLocales).toEqual(["en", "fr"]);
  });

  test("loads the use-case pages through stable canonical doc routes", () => {
    const prReviewPage = loadDocPage("pr-review-factory", STARTER_CONTENT_ROOT);
    const releaseReadinessPage = loadDocPage(
      "release-readiness-factory",
      STARTER_CONTENT_ROOT,
    );

    expect(prReviewPage).toMatchObject({
      record: {
        id: "doc/pr-review-factory",
        routePath: "/docs/pr-review-factory",
        canonicalLocale: "en",
        availableLocales: ["en"],
      },
      title: "PR Review Factory",
      resolution: {
        canonicalPageId: "doc/pr-review-factory",
        canonicalLocale: "en",
        requestedLocale: "en",
        resolvedLocale: "en",
        fellBackToCanonicalLocale: false,
      },
    });
    expect(prReviewPage.body).toContain("What this workflow is for");
    expect(prReviewPage.body).toContain("Inputs and outputs");

    expect(releaseReadinessPage).toMatchObject({
      record: {
        id: "doc/release-readiness-factory",
        routePath: "/docs/release-readiness-factory",
        canonicalLocale: "en",
        availableLocales: ["en"],
      },
      title: "Release Readiness Factory",
      resolution: {
        canonicalPageId: "doc/release-readiness-factory",
        canonicalLocale: "en",
        requestedLocale: "en",
        resolvedLocale: "en",
        fellBackToCanonicalLocale: false,
      },
    });
    expect(releaseReadinessPage.body).toContain("What this workflow is for");
    expect(releaseReadinessPage.body).toContain("Inputs and outputs");
  });
});
