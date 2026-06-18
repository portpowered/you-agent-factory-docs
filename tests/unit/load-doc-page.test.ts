import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadDocPage } from "../../src/lib/content";

const STARTER_CONTENT_ROOT = join(import.meta.dir, "../../src/content");

describe("loadDocPage", () => {
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

  test("loads the logs-and-replays guide from starter content", () => {
    const page = loadDocPage("logs-and-replays", STARTER_CONTENT_ROOT);

    expect(page.record.id).toBe("doc/logs-and-replays");
    expect(page.record.routePath).toBe("/docs/logs-and-replays");
    expect(page.title).toBe("Logs and replays");
    expect(page.body).toContain("post-run inspection");
    expect(page.body).toContain("Start with the run summary");
    expect(page.body).toContain("Did the workflow finish successfully");
    expect(page.body).toContain(
      "the final artifact, file change, or generated response",
    );
    expect(page.body).toContain(
      "A healthy successful run should leave behind more than a green status badge.",
    );
    expect(page.body).toContain(
      "the result summary and the output-producing step describe the same outcome",
    );
    expect(page.resolution).toEqual({
      canonicalPageId: "doc/logs-and-replays",
      canonicalLocale: "en",
      requestedLocale: "en",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: false,
    });
  });
});
