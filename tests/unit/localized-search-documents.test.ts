import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  type CanonicalContentRecord,
  buildLocalizedSearchDocumentId,
  extractMarkdownHeadings,
  extractSearchableBody,
  generateLocalizedSearchDocuments,
  isSearchableCanonicalContentRecord,
  loadLocalizedSearchDocuments,
  projectLocalizedSearchDocument,
  shouldIncludeVariantInSearch,
  validateStarterContentSource,
} from "../../src/lib/content";
import type { LocalizedContentVariantBinding } from "../../src/lib/content/localized-variant-identity";

const CONTENT_ROOT = join(process.cwd(), "src/content");

function createPublishedDocRecord(
  overrides: Partial<CanonicalContentRecord> = {},
): CanonicalContentRecord {
  return {
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
    navigationTitle: "Getting started",
    ...overrides,
  };
}

function createBinding(
  record: CanonicalContentRecord,
  variantLocale = "en",
): LocalizedContentVariantBinding {
  return {
    contentPathKey: record.id,
    variantLocale,
    record,
  };
}

const PUBLISHED_SOURCE = `---
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
search.include: true
---

# Getting started
`;

describe("localized search document generation", () => {
  test("projects one normalized search document per validated locale variant binding", () => {
    const documents = loadLocalizedSearchDocuments(CONTENT_ROOT);

    expect(documents.map((document) => document.id).sort()).toEqual([
      "blog/introducing-factory@en",
      "comparison/vs-n8n@en",
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
  });

  test("includes reviewer-verifiable searchable fields from canonical records and variant source", () => {
    const enValidation = validateStarterContentSource(
      "docs",
      "getting-started",
      "en",
      `---
id: doc/getting-started
kind: doc
title: Getting started
description: Install and run You Agent Factory.
canonicalLocale: en
availableLocales:
  - en
  - fr
status: published
tags:
  - docs
  - onboarding
section: guides
search.priority: 10
aliases:
  - quickstart
---

# Getting started

## Install the CLI

Run \`bun install\` to bootstrap the project.
`,
    );
    const frValidation = validateStarterContentSource(
      "docs",
      "getting-started",
      "fr",
      `---
id: doc/getting-started
kind: doc
title: Commencer
description: Installez et exécutez You Agent Factory.
canonicalLocale: en
availableLocales:
  - en
  - fr
status: published
tags:
  - docs
  - onboarding
section: guides
search.priority: 10
---

# Commencer

## Installer l'outil

Exécutez \`bun install\`.
`,
    );

    expect(enValidation.ok).toBe(true);
    expect(frValidation.ok).toBe(true);
    if (!enValidation.ok || !frValidation.ok) {
      throw new Error("expected starter content validation success");
    }

    const documents = generateLocalizedSearchDocuments(
      [
        {
          contentPathKey: "doc/getting-started",
          variantLocale: "en",
          record: enValidation.record,
        },
        {
          contentPathKey: "doc/getting-started",
          variantLocale: "fr",
          record: frValidation.record,
        },
      ],
      (binding) =>
        binding.variantLocale === "en"
          ? enValidation.descriptor.source
          : frValidation.descriptor.source,
    );

    expect(documents).toHaveLength(2);

    const englishDocument = documents.find(
      (document) => document.locale === "en",
    );
    const frenchDocument = documents.find(
      (document) => document.locale === "fr",
    );

    expect(englishDocument).toEqual({
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

    expect(frenchDocument).toMatchObject({
      id: "doc/getting-started@fr",
      canonicalId: "doc/getting-started",
      locale: "fr",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      title: "Commencer",
      description: "Installez et exécutez You Agent Factory.",
      headings: ["Commencer", "Installer l'outil"],
      url: "/docs/getting-started",
      searchPriority: 10,
    });
    expect(frenchDocument?.aliases).toBeUndefined();
  });

  test("preserves canonical-locale and available-locale metadata from canonical records", () => {
    const documents = loadLocalizedSearchDocuments(CONTENT_ROOT);
    const gettingStarted = documents.filter(
      (document) => document.canonicalId === "doc/getting-started",
    );

    expect(gettingStarted).toHaveLength(2);
    for (const document of gettingStarted) {
      expect(document.canonicalLocale).toBe("en");
      expect(document.availableLocales).toEqual(["en", "fr"]);
    }
  });

  test("builds stable search-document ids from canonical id and locale", () => {
    expect(buildLocalizedSearchDocumentId("doc/getting-started", "en")).toBe(
      "doc/getting-started@en",
    );
  });

  test("extracts markdown headings and searchable body text without requiring query-layer file access", () => {
    const markdown = `# Overview

## First step

Visit [docs](/docs/getting-started) for details.
`;

    expect(extractMarkdownHeadings(markdown)).toEqual([
      "Overview",
      "First step",
    ]);
    expect(extractSearchableBody(markdown)).toBe(
      "Overview First step Visit docs for details.",
    );
  });

  test("projects search documents directly from bindings and in-memory source", () => {
    const validation = validateStarterContentSource(
      "glossary",
      "agent",
      "en",
      `---
id: glossary/agent
kind: glossary
title: Agent
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - glossary
section: terms
search.priority: 8
aliases:
  - ai agent
---

# Agent

An autonomous software actor.
`,
    );

    expect(validation.ok).toBe(true);
    if (!validation.ok) {
      throw new Error("expected starter content validation success");
    }

    const document = projectLocalizedSearchDocument(
      {
        contentPathKey: "glossary/agent",
        variantLocale: "en",
        record: validation.record,
      },
      validation.descriptor.source,
    );

    expect(document).toMatchObject({
      canonicalId: "glossary/agent",
      locale: "en",
      kind: "glossary",
      section: "terms",
      aliases: ["ai agent"],
      searchPriority: 8,
      body: "Agent An autonomous software actor.",
    });
  });

  test("includes published variants with search.include enabled", () => {
    const publishedRecord = createPublishedDocRecord();
    const bindings = [createBinding(publishedRecord)];

    expect(isSearchableCanonicalContentRecord(publishedRecord)).toBe(true);
    expect(shouldIncludeVariantInSearch(bindings[0])).toBe(true);

    const documents = generateLocalizedSearchDocuments(
      bindings,
      () => PUBLISHED_SOURCE,
    );

    expect(documents).toHaveLength(1);
    expect(documents[0]?.id).toBe("doc/getting-started@en");
  });

  test.each([
    ["draft", { status: "draft" as const }],
    ["internal", { status: "internal" as const }],
    ["hidden", { status: "hidden" as const }],
    ["search.include: false", { searchInclude: false }],
  ])(
    "excludes non-public localized variants marked %s from generated search documents",
    (_label, overrides) => {
      const excludedRecord = createPublishedDocRecord(overrides);
      const publishedRecord = createPublishedDocRecord({
        id: "doc/installation",
        slug: "installation",
        routePath: "/docs/installation",
        navigationTitle: "Installation",
      });
      const bindings = [
        createBinding(excludedRecord),
        createBinding(publishedRecord),
      ];

      expect(isSearchableCanonicalContentRecord(excludedRecord)).toBe(false);
      expect(shouldIncludeVariantInSearch(bindings[0])).toBe(false);

      const documents = generateLocalizedSearchDocuments(bindings, (binding) =>
        binding.record.id === "doc/installation"
          ? "# Installation"
          : PUBLISHED_SOURCE,
      );

      expect(documents.map((document) => document.id)).toEqual([
        "doc/installation@en",
      ]);
    },
  );
});
