import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  buildMetadataFromStarterContent,
  loadStarterContentRecords,
  validateStarterContentSource,
} from "../../src/lib/content";

const CONTENT_ROOT = join(import.meta.dir, "../../src/content");

describe("starter content validation", () => {
  test("projects schema-compliant starter content into canonical records", () => {
    const result = validateStarterContentSource(
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
search.include: true
search.priority: 10
---

# Getting started
`,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected starter content validation success");
    }

    expect(result.record).toEqual({
      id: "doc/getting-started",
      kind: "doc",
      slug: "getting-started",
      routePath: "/docs/getting-started",
      section: "guides",
      tags: ["docs"],
      status: "published",
      order: 1,
      canonicalLocale: "en",
      availableLocales: ["en"],
      searchInclude: true,
      searchPriority: 10,
      navigationTitle: "Getting started",
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

    expect(
      failures.every(
        (failure) => failure.descriptor.slug === "invalid-fixture",
      ),
    ).toBe(true);
    expect(records.map((record) => record.id).sort()).toEqual([
      "blog/introducing-factory",
      "comparison/vs-n8n",
      "doc/getting-started",
      "glossary/agent",
      "reference/loop-engineering",
    ]);

    for (const record of records) {
      expect(record.canonicalLocale).toBe("en");
      expect(record.availableLocales).toEqual(["en"]);
      expect(record.navigationTitle.length).toBeGreaterThan(0);
    }
  });

  test("surfaces invalid starter fixtures from the content root without partial records", () => {
    const { records, failures } = loadStarterContentRecords(CONTENT_ROOT);

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
});
