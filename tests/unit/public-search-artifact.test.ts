import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildPublicSearchArtifact,
  loadPublicSearchArtifact,
  serializePublicSearchArtifact,
  writePublicSearchArtifact,
} from "../../src/lib/content";
import type { LocalizedSearchDocument } from "../../src/lib/content/search-document";

const CONTENT_ROOT = join(process.cwd(), "src/content");

const REPRESENTATIVE_DOCUMENT: LocalizedSearchDocument = {
  id: "doc/getting-started@en",
  canonicalId: "doc/getting-started",
  locale: "en",
  canonicalLocale: "en",
  availableLocales: ["en", "fr"],
  kind: "doc",
  url: "/docs/getting-started",
  title: "Getting started",
  description: "Install and run You Agent Factory.",
  headings: ["Getting started", "Install the CLI"],
  body: "Getting started Install the CLI Run bun install to bootstrap the project.",
  tags: ["docs", "onboarding"],
  aliases: ["quickstart"],
  section: "guides",
  searchPriority: 10,
};

describe("public search artifact generation", () => {
  test("builds a deterministic artifact from normalized localized search documents", () => {
    const artifact = buildPublicSearchArtifact([
      REPRESENTATIVE_DOCUMENT,
      {
        ...REPRESENTATIVE_DOCUMENT,
        id: "doc/getting-started@fr",
        locale: "fr",
        title: "Commencer",
        description: "Installez et exécutez You Agent Factory.",
        headings: ["Commencer"],
        body: "Commencer",
        aliases: undefined,
      },
    ]);

    expect(artifact.version).toBe(1);
    expect(artifact.entries.map((entry) => entry.id)).toEqual([
      "doc/getting-started@en",
      "doc/getting-started@fr",
    ]);
    expect(artifact.entries[0]).toEqual({
      id: "doc/getting-started@en",
      canonicalId: "doc/getting-started",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      kind: "doc",
      url: "/docs/getting-started",
      title: "Getting started",
      description: "Install and run You Agent Factory.",
      headings: ["Getting started", "Install the CLI"],
      body: "Getting started Install the CLI Run bun install to bootstrap the project.",
      tags: ["docs", "onboarding"],
      aliases: ["quickstart"],
      section: "guides",
      searchPriority: 10,
    });
  });

  test("serializes the artifact with stable JSON output", () => {
    const artifact = buildPublicSearchArtifact([REPRESENTATIVE_DOCUMENT]);
    const first = serializePublicSearchArtifact(artifact);
    const second = serializePublicSearchArtifact(artifact);

    expect(first).toBe(second);
    expect(first).toContain('"canonicalId": "doc/getting-started"');
    expect(first).toContain('"searchPriority": 10');
  });

  test("loads starter content through the search-document path into a reviewer-verifiable artifact", () => {
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    expect(artifact.entries.map((entry) => entry.id).sort()).toEqual([
      "blog/introducing-factory@en",
      "comparison/vs-n8n@en",
      "doc/coder-reviewer-pattern@en",
      "doc/concepts@en",
      "doc/configuration@en",
      "doc/getting-started@en",
      "doc/getting-started@fr",
      "doc/installation@en",
      "doc/introduction@en",
      "doc/quickstart@en",
      "glossary/agent@en",
      "reference/loop-engineering@en",
    ]);

    const gettingStarted = artifact.entries.find(
      (entry) => entry.id === "doc/getting-started@en",
    );

    expect(gettingStarted).toMatchObject({
      canonicalId: "doc/getting-started",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      url: "/docs/getting-started",
      title: "Getting started",
      section: "guides",
      searchPriority: 10,
    });
    expect(gettingStarted?.headings.length).toBeGreaterThan(0);
    expect(gettingStarted?.body.length).toBeGreaterThan(0);

    const coderReviewerPattern = artifact.entries.find(
      (entry) => entry.id === "doc/coder-reviewer-pattern@en",
    );

    expect(coderReviewerPattern).toMatchObject({
      canonicalId: "doc/coder-reviewer-pattern",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      url: "/docs/coder-reviewer-pattern",
      title: "Coder / Reviewer pattern",
      section: "guides",
      searchPriority: 8,
    });
    expect(coderReviewerPattern?.headings).toEqual([
      "Coder / Reviewer pattern",
      "Who the two roles are",
      "Coder",
      "Reviewer",
      "How the handoff works",
      "What the review loop looks like",
      "What teams get from the pattern",
    ]);
    expect(coderReviewerPattern?.body).toContain(
      "one role focused on producing the change",
    );
    expect(coderReviewerPattern?.body).toContain(
      "approves the work or sends it back with concrete changes requested",
    );
  });

  test("preserves locale-aware canonical-locale relationships for active-locale-first query defaults", () => {
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    const gettingStartedEntries = artifact.entries.filter(
      (entry) => entry.canonicalId === "doc/getting-started",
    );

    expect(gettingStartedEntries.map((entry) => entry.locale).sort()).toEqual([
      "en",
      "fr",
    ]);

    for (const entry of gettingStartedEntries) {
      expect(entry).toMatchObject({
        canonicalId: "doc/getting-started",
        canonicalLocale: "en",
        availableLocales: ["en", "fr"],
      });
    }

    const englishEntry = gettingStartedEntries.find(
      (entry) => entry.locale === "en",
    );
    const frenchEntry = gettingStartedEntries.find(
      (entry) => entry.locale === "fr",
    );

    expect(englishEntry?.locale).toBe("en");
    expect(frenchEntry?.locale).toBe("fr");
    expect(englishEntry?.canonicalLocale).toBe("en");
    expect(frenchEntry?.canonicalLocale).toBe("en");
  });

  test("writes the generated artifact to disk for build-time inspection", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "public-search-artifact-"));
    const outputPath = join(outputDir, "search/public-search-index.json");

    const artifact = writePublicSearchArtifact({
      contentRoot: CONTENT_ROOT,
      outputPath,
    });

    const written = JSON.parse(readFileSync(outputPath, "utf8"));
    expect(written).toEqual(artifact);
    expect(written.entries.length).toBeGreaterThan(0);
  });
});
