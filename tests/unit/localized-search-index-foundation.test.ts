import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadLocalizedSearchDocuments,
  loadPublicSearchArtifact,
} from "../../src/lib/content";

const CONTENT_ROOT = join(process.cwd(), "src/content");

function writeDocFixture(
  contentRoot: string,
  slug: string,
  source: string,
): void {
  const fixtureDir = join(contentRoot, "docs", slug);
  mkdirSync(fixtureDir, { recursive: true });
  writeFileSync(join(fixtureDir, "en.mdx"), source);
}

function collectSearchIds(values: { id: string }[]): string[] {
  return values.map((value) => value.id).sort();
}

describe("localized search index foundation verification", () => {
  test("keeps enriched glossary, comparison, and reference starters on the same canonical identities and current public routes", () => {
    const documents = loadLocalizedSearchDocuments(CONTENT_ROOT);
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    const expectedEntries = [
      {
        id: "glossary/agent@en",
        canonicalId: "glossary/agent",
        kind: "glossary",
        url: "/glossary/agent",
        title: "Agent",
        bodySnippet: "named worker inside a workflow",
      },
      {
        id: "comparison/vs-n8n@en",
        canonicalId: "comparison/vs-n8n",
        kind: "comparison",
        url: "/comparisons/vs-n8n",
        title: "You Agent Factory vs n8n",
        bodySnippet: "approval-driven orchestration",
      },
      {
        id: "reference/loop-engineering@en",
        canonicalId: "reference/loop-engineering",
        kind: "reference",
        url: "/references/loop-engineering",
        title: "Loop engineering",
        bodySnippet: "designing the feedback cycle around an agent workflow",
      },
    ] as const;

    for (const expectedEntry of expectedEntries) {
      const document = documents.find(
        (candidate) => candidate.id === expectedEntry.id,
      );
      const artifactEntry = artifact.entries.find(
        (candidate) => candidate.id === expectedEntry.id,
      );

      expect(document).toMatchObject({
        canonicalId: expectedEntry.canonicalId,
        kind: expectedEntry.kind,
        locale: "en",
        canonicalLocale: "en",
        availableLocales: ["en"],
        url: expectedEntry.url,
        title: expectedEntry.title,
      });
      expect(document?.headings.length).toBeGreaterThan(1);
      expect(document?.body).toContain(expectedEntry.bodySnippet);

      expect(artifactEntry).toMatchObject({
        canonicalId: expectedEntry.canonicalId,
        kind: expectedEntry.kind,
        locale: "en",
        canonicalLocale: "en",
        availableLocales: ["en"],
        url: expectedEntry.url,
        title: expectedEntry.title,
      });
      expect(artifactEntry?.headings).toEqual(document?.headings);
      expect(artifactEntry?.body).toContain(expectedEntry.bodySnippet);
    }
  });

  test("includes representative public localized content in search documents and generated artifact", () => {
    const documents = loadLocalizedSearchDocuments(CONTENT_ROOT);
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    const englishDocument = documents.find(
      (document) => document.id === "doc/getting-started@en",
    );
    const frenchDocument = documents.find(
      (document) => document.id === "doc/getting-started@fr",
    );

    expect(englishDocument).toMatchObject({
      canonicalId: "doc/getting-started",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      url: "/docs/getting-started",
      title: "Getting started",
      section: "guides",
    });
    expect(englishDocument?.headings.length).toBeGreaterThan(0);
    expect(englishDocument?.body.length).toBeGreaterThan(0);

    expect(frenchDocument).toMatchObject({
      canonicalId: "doc/getting-started",
      locale: "fr",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      url: "/docs/getting-started",
      title: "Commencer",
      section: "guides",
    });
    expect(frenchDocument?.headings.length).toBeGreaterThan(0);
    expect(frenchDocument?.body.length).toBeGreaterThan(0);

    const englishEntry = artifact.entries.find(
      (entry) => entry.id === "doc/getting-started@en",
    );
    const frenchEntry = artifact.entries.find(
      (entry) => entry.id === "doc/getting-started@fr",
    );

    expect(englishEntry).toMatchObject({
      canonicalId: "doc/getting-started",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      url: "/docs/getting-started",
      title: "Getting started",
      section: "guides",
    });
    expect(frenchEntry).toMatchObject({
      canonicalId: "doc/getting-started",
      locale: "fr",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      url: "/docs/getting-started",
      title: "Commencer",
      section: "guides",
    });

    expect(collectSearchIds(artifact.entries)).toEqual(
      collectSearchIds(documents),
    );
  });

  test("excludes non-public localized variants from search documents and generated artifact", () => {
    const contentRoot = mkdtempSync(join(tmpdir(), "search-index-exclusion-"));

    writeDocFixture(
      contentRoot,
      "public-page",
      `---
id: doc/public-page
kind: doc
title: Public page
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - docs
section: guides
search.include: true
---

# Public page

Included in search.
`,
    );

    writeDocFixture(
      contentRoot,
      "draft-page",
      `---
id: doc/draft-page
kind: doc
title: Draft page
canonicalLocale: en
availableLocales:
  - en
status: draft
tags:
  - docs
section: guides
search.include: true
---

# Draft page
`,
    );

    writeDocFixture(
      contentRoot,
      "internal-page",
      `---
id: doc/internal-page
kind: doc
title: Internal page
canonicalLocale: en
availableLocales:
  - en
status: internal
tags:
  - docs
section: guides
search.include: true
---

# Internal page
`,
    );

    writeDocFixture(
      contentRoot,
      "hidden-page",
      `---
id: doc/hidden-page
kind: doc
title: Hidden page
canonicalLocale: en
availableLocales:
  - en
status: hidden
tags:
  - docs
section: guides
search.include: true
---

# Hidden page
`,
    );

    writeDocFixture(
      contentRoot,
      "search-excluded-page",
      `---
id: doc/search-excluded-page
kind: doc
title: Search excluded page
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - docs
section: guides
search.include: false
---

# Search excluded page
`,
    );

    const documents = loadLocalizedSearchDocuments(contentRoot);
    const artifact = loadPublicSearchArtifact({ contentRoot });

    expect(collectSearchIds(documents)).toEqual(["doc/public-page@en"]);
    expect(collectSearchIds(artifact.entries)).toEqual(["doc/public-page@en"]);

    for (const excludedCanonicalId of [
      "doc/draft-page",
      "doc/internal-page",
      "doc/hidden-page",
      "doc/search-excluded-page",
    ]) {
      expect(
        documents.some(
          (document) => document.canonicalId === excludedCanonicalId,
        ),
      ).toBe(false);
      expect(
        artifact.entries.some(
          (entry) => entry.canonicalId === excludedCanonicalId,
        ),
      ).toBe(false);
    }
  });

  test("keeps generated artifact entries aligned with normalized search documents", () => {
    const documents = loadLocalizedSearchDocuments(CONTENT_ROOT);
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    expect(artifact.version).toBe(1);
    expect(artifact.entries).toHaveLength(documents.length);

    for (const document of documents) {
      const entry = artifact.entries.find(
        (candidate) => candidate.id === document.id,
      );

      expect(entry).toEqual({
        id: document.id,
        canonicalId: document.canonicalId,
        locale: document.locale,
        canonicalLocale: document.canonicalLocale,
        availableLocales: [...document.availableLocales],
        kind: document.kind,
        url: document.url,
        title: document.title,
        description: document.description,
        headings: [...document.headings],
        body: document.body,
        tags: [...document.tags],
        section: document.section,
        searchPriority: document.searchPriority,
        ...(document.aliases ? { aliases: [...document.aliases] } : {}),
      });
    }
  });
});
