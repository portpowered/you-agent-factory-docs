import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  buildMetadataFromStarterContent,
  loadStarterContentRecords,
  validateStarterContentSource,
} from "../../src/lib/content";

const CONTENT_ROOT = join(import.meta.dir, "../../src/content");
const INVALID_FIXTURE_ROOT = join(
  import.meta.dir,
  "../fixtures/starter-content",
);

describe("starter content validation", () => {
  test("projects schema-compliant starter content into canonical records", () => {
    const result = validateStarterContentSource(
      "docs",
      "introduction",
      "en",
      `---
id: doc/introduction
kind: doc
title: Introduction
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - docs
section: setup
order: 0
search.include: true
search.priority: 10
---

# Introduction
`,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected starter content validation success");
    }

    expect(result.record).toEqual({
      id: "doc/introduction",
      kind: "doc",
      slug: "introduction",
      routePath: "/docs/introduction",
      section: "setup",
      tags: ["docs"],
      status: "published",
      order: 0,
      canonicalLocale: "en",
      availableLocales: ["en"],
      searchInclude: true,
      searchPriority: 10,
      navigationTitle: "Introduction",
    });
  });

  test("rejects invalid starter content with clear content-focused errors", () => {
    const result = validateStarterContentSource(
      "docs",
      "invalid-fixture",
      "en",
      `---
id: doc/invalid-fixture
kind: doc
title: Invalid fixture
canonicalLocale: en
availableLocales:
  - fr
status: archived
tags:
  - docs
section: guides
---

# Invalid fixture
`,
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected starter content validation failure");
    }

    const fields = result.errors.map((error) => error.field);
    expect(fields).toContain("canonicalLocale");
    expect(fields).toContain("status");
    expect(
      result.errors.some(
        (error) =>
          error.field === "canonicalLocale" &&
          error.message.includes("must be included in availableLocales"),
      ),
    ).toBe(true);
    expect(
      result.errors.some(
        (error) =>
          error.field === "status" &&
          error.message.includes("published, draft, internal, hidden"),
      ),
    ).toBe(true);
  });

  test("derives kind and slug from starter content directory context when omitted", () => {
    const metadata = buildMetadataFromStarterContent({
      contentDirectory: "glossary",
      slug: "agent",
      locale: "en",
      source: `---
id: glossary/agent
title: Agent
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - glossary
navigationTitle: Agent term
---

# Agent
`,
    });

    expect(metadata).toEqual(
      expect.objectContaining({
        id: "glossary/agent",
        kind: "glossary",
        slug: "agent",
        canonicalLocale: "en",
        availableLocales: ["en"],
        navigationTitle: "Agent term",
      }),
    );
  });

  test("loads valid starter fixtures for every supported public content kind", () => {
    const { records, failures } = loadStarterContentRecords(CONTENT_ROOT);

    expect(failures).toEqual([]);
    expect(records.map((record) => record.id).sort()).toEqual([
      "blog/introducing-factory",
      "comparison/vs-n8n",
      "doc/coder-reviewer-pattern",
      "doc/concepts",
      "doc/configuration",
      "doc/getting-started",
      "doc/getting-started",
      "doc/installation",
      "doc/introduction",
      "doc/quickstart",
      "glossary/agent",
      "reference/loop-engineering",
    ]);

    const singleLocaleRecords = records.filter(
      (record) => record.id !== "doc/getting-started",
    );
    for (const record of singleLocaleRecords) {
      expect(record.canonicalLocale).toBe("en");
      expect(record.availableLocales).toEqual(["en"]);
      expect(record.navigationTitle.length).toBeGreaterThan(0);
    }

    const gettingStartedRecords = records.filter(
      (record) => record.id === "doc/getting-started",
    );
    expect(gettingStartedRecords).toHaveLength(2);
    expect(
      gettingStartedRecords.every(
        (record) =>
          record.canonicalLocale === "en" &&
          record.availableLocales.join(",") === "en,fr",
      ),
    ).toBe(true);
  });

  test("surfaces invalid starter fixtures without partial records", () => {
    const { records, failures } =
      loadStarterContentRecords(INVALID_FIXTURE_ROOT);

    const invalidFailure = failures.find(
      (failure) => failure.descriptor.slug === "invalid-fixture",
    );

    expect(invalidFailure).toBeDefined();
    if (!invalidFailure) {
      throw new Error("expected invalid fixture failure");
    }

    expect(invalidFailure.ok).toBe(false);
    expect(records.some((record) => record.id === "doc/invalid-fixture")).toBe(
      false,
    );
  });

  test("blocks inferred locale metadata and missing canonical-locale variants through the loader", () => {
    const { records, failures } =
      loadStarterContentRecords(INVALID_FIXTURE_ROOT);

    const inferredFailure = failures.find(
      (failure) => failure.descriptor.slug === "inferred-locale-metadata",
    );
    expect(inferredFailure?.errors.map((error) => error.field).sort()).toEqual([
      "availableLocales",
      "canonicalLocale",
      "id",
    ]);

    const missingCanonicalVariantFailure = failures.find(
      (failure) => failure.descriptor.slug === "missing-canonical-variant",
    );
    expect(
      missingCanonicalVariantFailure?.errors.some(
        (error) =>
          error.field === "doc/missing-canonical-variant.canonicalLocale" &&
          error.message.includes('missing canonical-locale variant "en"'),
      ),
    ).toBe(true);
    expect(
      records.some((record) => record.id === "doc/missing-canonical-variant"),
    ).toBe(false);

    const unsupportedRegistryFailure = failures.find(
      (failure) => failure.descriptor.slug === "unsupported-registry-locale",
    );
    expect(
      unsupportedRegistryFailure?.errors.some(
        (error) =>
          error.field === "canonicalLocale" &&
          error.message.includes("not a supported locale"),
      ),
    ).toBe(true);
  });
});
