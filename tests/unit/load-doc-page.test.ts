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

  test("loads the CLI overview body through the published docs page path", () => {
    const page = loadDocPage("cli", STARTER_CONTENT_ROOT);

    expect(page.record.routePath).toBe("/docs/cli");
    expect(page.title).toBe("CLI overview");
    expect(page.body).toContain(
      "The You Agent Factory CLI is the operator surface",
    );
    expect(page.body).toContain("Typical commands and outcomes");
    expect(page.body).toContain("`you submit batch --dry-run <path>`");
  });

  test("loads the configuration overview body through the published docs page path", () => {
    const page = loadDocPage("configuration", STARTER_CONTENT_ROOT);

    expect(page.record.routePath).toBe("/docs/configuration");
    expect(page.title).toBe("Configuration");
    expect(page.body).toContain(
      "Configuration is the contract between the CLI command you run and the workflow behavior the factory will execute.",
    );
    expect(page.body).toContain("Main configuration concepts");
    expect(page.body).toContain(
      "workflow definitions, task or PRD inputs that name the work to perform",
    );
    expect(page.body).toContain(
      "it shapes what the operator should expect from the same CLI surface",
    );
  });

  test("loads the workflow concepts body through the published docs page path", () => {
    const page = loadDocPage("concepts", STARTER_CONTENT_ROOT);

    expect(page.record.routePath).toBe("/docs/concepts");
    expect(page.title).toBe("Workflow concepts");
    expect(page.body).toContain(
      "Workflow concepts explain how the CLI, configuration, approvals, and outputs fit together",
    );
    expect(page.body).toContain("Where approvals fit");
    expect(page.body).toContain(
      "append-only progress logging, and PR conversation updates",
    );
    expect(page.body).toContain(
      "configuration decides which stages exist and where approvals happen",
    );
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
    expect(page.body).toContain(
      "When a workflow does not finish cleanly, do not start by reading the entire trace from top to bottom.",
    );
    expect(page.body).toContain(
      "the step marked failed, blocked, or waiting for approval",
    );
    expect(page.body).toContain(
      "Use replay or rerun surfaces to narrow the problem",
    );
    expect(page.body).toContain(
      "compare the repeated run with the original run summary, outputs, and failing step",
    );
    expect(page.body).toContain(
      "Two common first-adoption problems are a missing expected output and a workflow that appears stuck waiting for approval.",
    );
    expect(page.body).toContain("Failure path checklist");
    expect(page.resolution).toEqual({
      canonicalPageId: "doc/logs-and-replays",
      canonicalLocale: "en",
      requestedLocale: "en",
      resolvedLocale: "en",
      fellBackToCanonicalLocale: false,
    });
  });
});
