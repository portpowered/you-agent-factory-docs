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
      "doc/cli@en",
      "doc/coder-reviewer-pattern@en",
      "doc/concepts@en",
      "doc/configuration@en",
      "doc/getting-started@en",
      "doc/getting-started@fr",
      "doc/human-approval-gates@en",
      "doc/installation@en",
      "doc/introduction@en",
      "doc/pr-review-factory@en",
      "doc/quickstart@en",
      "doc/release-readiness-factory@en",
      "glossary/agent@en",
      "reference/loop-engineering@en",
    ]);

    const gettingStarted = artifact.entries.find(
      (entry) => entry.id === "doc/getting-started@en",
    );
    const cli = artifact.entries.find((entry) => entry.id === "doc/cli@en");
    const coderReviewerPattern = artifact.entries.find(
      (entry) => entry.id === "doc/coder-reviewer-pattern@en",
    );
    const configuration = artifact.entries.find(
      (entry) => entry.id === "doc/configuration@en",
    );
    const concepts = artifact.entries.find(
      (entry) => entry.id === "doc/concepts@en",
    );
    const humanApprovalGates = artifact.entries.find(
      (entry) => entry.id === "doc/human-approval-gates@en",
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

    expect(cli).toMatchObject({
      canonicalId: "doc/cli",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      url: "/docs/cli",
      title: "CLI overview",
      section: "guides",
      searchPriority: 9,
    });
    expect(cli?.headings.length).toBeGreaterThan(0);
    expect(cli?.body).toContain("Typical commands and outcomes");

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
      "Where approval gates matter",
      "Realistic limits and failure modes",
    ]);
    expect(coderReviewerPattern?.body).toContain(
      "one role focused on producing the change",
    );
    expect(coderReviewerPattern?.body).toContain(
      "approves the work or sends it back with concrete changes requested",
    );
    expect(coderReviewerPattern?.body).toContain(
      "approval is treated as a real gate",
    );
    expect(coderReviewerPattern?.body).toContain(
      "The most common failure mode is shallow review",
    );

    expect(configuration).toMatchObject({
      canonicalId: "doc/configuration",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      url: "/docs/configuration",
      title: "Configuration",
      section: "guides",
    });
    expect(configuration?.headings.length).toBeGreaterThan(0);
    expect(configuration?.body).toContain(
      "How configuration changes execution",
    );

    expect(concepts).toMatchObject({
      canonicalId: "doc/concepts",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      url: "/docs/concepts",
      title: "Workflow concepts",
      section: "guides",
    });
    expect(concepts?.headings.length).toBeGreaterThan(0);
    expect(concepts?.body).toContain("How the CLI and configuration connect");

    expect(humanApprovalGates).toMatchObject({
      canonicalId: "doc/human-approval-gates",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      url: "/docs/human-approval-gates",
      title: "Human approval gates",
      section: "guides",
      searchPriority: 8,
    });
    expect(humanApprovalGates?.headings).toEqual([
      "Human approval gates",
      "What this guide is for",
      "When a workflow should pause for review",
      "What approval gates are meant to catch",
      "What reviewers should inspect before approving",
      "Why approval loops improve safe adoption",
      "How this page fits the rest of the docs",
    ]);
    expect(humanApprovalGates?.body).toContain(
      "one canonical guide about approval checkpoints in You Agent Factory workflows",
    );
    expect(humanApprovalGates?.body).toContain(
      "An approval gate should interrupt execution at a meaningful risk boundary, not at every trivial handoff.",
    );
    expect(humanApprovalGates?.body).toContain(
      "Approval loops exist to catch avoidable failures while the workflow still has a clean stopping point.",
    );
    expect(humanApprovalGates?.body).toContain(
      "Treat an approval as an evidence check, not a gut check.",
    );
    expect(humanApprovalGates?.body).toContain(
      "the proposed diff, generated document or output, stage summary, logs, and any validation or test results",
    );
    expect(humanApprovalGates?.body).toContain(
      "Approval loops reduce avoidable failure by stopping the workflow before one wrong assumption compounds into several expensive follow-on actions.",
    );
    expect(humanApprovalGates?.body).toContain(
      "That control has a cost: every gate slows throughput because the workflow waits for a human decision.",
    );
    expect(humanApprovalGates?.body).toContain(
      "Approval loops improve the odds of safe operation, but they do not guarantee correctness.",
    );
    expect(humanApprovalGates?.body).toContain(
      "Continue to the Coder / Reviewer pattern",
    );
  });

  test("surfaces substantive glossary starter copy on the existing canonical record", () => {
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    const glossaryAgent = artifact.entries.find(
      (entry) => entry.id === "glossary/agent@en",
    );

    expect(glossaryAgent).toMatchObject({
      canonicalId: "glossary/agent",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "glossary",
      url: "/glossary/agent",
      title: "Agent",
      section: "terms",
      searchPriority: 8,
    });
    expect(glossaryAgent?.headings).toEqual([
      "Agent",
      "What the term means here",
      "Why it matters in You Agent Factory",
      "How to read the term as a first-time evaluator",
    ]);
    expect(glossaryAgent?.body).toContain("named worker inside a workflow");
    expect(glossaryAgent?.body).toContain(
      "repeatable process design, not one large prompt",
    );
    expect(glossaryAgent?.body).toContain(
      "scoped unit of work with a specific contract",
    );
  });

  test("surfaces substantive comparison starter copy on the existing canonical record", () => {
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    const comparison = artifact.entries.find(
      (entry) => entry.id === "comparison/vs-n8n@en",
    );

    expect(comparison).toMatchObject({
      canonicalId: "comparison/vs-n8n",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "comparison",
      url: "/comparisons/vs-n8n",
      title: "You Agent Factory vs n8n",
      section: "comparisons",
      searchPriority: 6,
    });
    expect(comparison?.headings).toEqual([
      "You Agent Factory vs n8n",
      "Where n8n fits best",
      "Where You Agent Factory fits best",
      "Practical tradeoffs to evaluate",
      "How to choose between them",
    ]);
    expect(comparison?.body).toContain(
      "engineering-heavy and needs structured agent roles",
    );
    expect(comparison?.body).toContain(
      "event-driven integration between external systems",
    );
    expect(comparison?.body).toContain("approval-driven orchestration");
  });

  test("surfaces substantive reference starter copy on the existing canonical record", () => {
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    const reference = artifact.entries.find(
      (entry) => entry.id === "reference/loop-engineering@en",
    );

    expect(reference).toMatchObject({
      canonicalId: "reference/loop-engineering",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "reference",
      url: "/references/loop-engineering",
      title: "Loop engineering",
      section: "references",
      searchPriority: 7,
    });
    expect(reference?.headings).toEqual([
      "Loop engineering",
      "What the reference topic covers",
      "Where loop engineering helps in practice",
      "What a healthy loop usually includes",
      "How to evaluate a loop as a first-time reader",
    ]);
    expect(reference?.body).toContain(
      "designing the feedback cycle around an agent workflow",
    );
    expect(reference?.body).toContain(
      "repeated improvement safe, inspectable, and cheap to reason about",
    );
    expect(reference?.body).toContain(
      "scoped worker, a concrete review step, a visible decision rule, and an exit condition",
    );
  });

  test("surfaces substantive glossary starter copy on the existing canonical record", () => {
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    const glossaryAgent = artifact.entries.find(
      (entry) => entry.id === "glossary/agent@en",
    );

    expect(glossaryAgent).toMatchObject({
      canonicalId: "glossary/agent",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "glossary",
      url: "/glossary/agent",
      title: "Agent",
      section: "terms",
      searchPriority: 8,
    });
    expect(glossaryAgent?.headings).toEqual([
      "Agent",
      "What the term means here",
      "Why it matters in You Agent Factory",
      "How to read the term as a first-time evaluator",
    ]);
    expect(glossaryAgent?.body).toContain("named worker inside a workflow");
    expect(glossaryAgent?.body).toContain(
      "repeatable process design, not one large prompt",
    );
    expect(glossaryAgent?.body).toContain(
      "scoped unit of work with a specific contract",
    );
  });

  test("surfaces substantive comparison starter copy on the existing canonical record", () => {
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    const comparison = artifact.entries.find(
      (entry) => entry.id === "comparison/vs-n8n@en",
    );

    expect(comparison).toMatchObject({
      canonicalId: "comparison/vs-n8n",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "comparison",
      url: "/comparisons/vs-n8n",
      title: "You Agent Factory vs n8n",
      section: "comparisons",
      searchPriority: 6,
    });
    expect(comparison?.headings).toEqual([
      "You Agent Factory vs n8n",
      "Where n8n fits best",
      "Where You Agent Factory fits best",
      "Practical tradeoffs to evaluate",
      "How to choose between them",
    ]);
    expect(comparison?.body).toContain(
      "engineering-heavy and needs structured agent roles",
    );
    expect(comparison?.body).toContain(
      "event-driven integration between external systems",
    );
    expect(comparison?.body).toContain("approval-driven orchestration");
  });

  test("surfaces substantive reference starter copy on the existing canonical record", () => {
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    const reference = artifact.entries.find(
      (entry) => entry.id === "reference/loop-engineering@en",
    );

    expect(reference).toMatchObject({
      canonicalId: "reference/loop-engineering",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "reference",
      url: "/references/loop-engineering",
      title: "Loop engineering",
      section: "references",
      searchPriority: 7,
    });
    expect(reference?.headings).toEqual([
      "Loop engineering",
      "What the reference topic covers",
      "Where loop engineering helps in practice",
      "What a healthy loop usually includes",
      "How to evaluate a loop as a first-time reader",
    ]);
    expect(reference?.body).toContain(
      "designing the feedback cycle around an agent workflow",
    );
    expect(reference?.body).toContain(
      "repeated improvement safe, inspectable, and cheap to reason about",
    );
    expect(reference?.body).toContain(
      "scoped worker, a concrete review step, a visible decision rule, and an exit condition",
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

  test("includes the use-case pages with stable canonical ids, routes, and searchable metadata", () => {
    const artifact = loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT });

    const prReviewEntry = artifact.entries.find(
      (entry) => entry.id === "doc/pr-review-factory@en",
    );
    const releaseReadinessEntry = artifact.entries.find(
      (entry) => entry.id === "doc/release-readiness-factory@en",
    );

    expect(prReviewEntry).toMatchObject({
      id: "doc/pr-review-factory@en",
      canonicalId: "doc/pr-review-factory",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      url: "/docs/pr-review-factory",
      title: "PR Review Factory",
      section: "use cases",
      searchPriority: 6,
    });
    expect(prReviewEntry?.headings).toEqual([
      "PR Review Factory",
      "What this workflow is for",
      "Who participates",
      "What enters the workflow",
      "Main workflow stages",
      "Review points that matter",
      "Inputs and outputs",
      "Why engineering teams use it",
    ]);
    expect(prReviewEntry?.body).toContain("review summary");

    expect(releaseReadinessEntry).toMatchObject({
      id: "doc/release-readiness-factory@en",
      canonicalId: "doc/release-readiness-factory",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      url: "/docs/release-readiness-factory",
      title: "Release Readiness Factory",
      section: "use cases",
      searchPriority: 5,
    });
    expect(releaseReadinessEntry?.headings).toEqual([
      "Release Readiness Factory",
      "What this workflow is for",
      "Who participates",
      "What enters the workflow",
      "Main workflow stages",
      "Readiness gates that matter",
      "Inputs and outputs",
      "Why engineering teams use it",
    ]);
    expect(releaseReadinessEntry?.body).toContain("readiness summary");
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
