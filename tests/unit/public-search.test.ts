import { describe, expect, test } from "bun:test";
import type { PublicSearchArtifact } from "../../src/lib/content";
import {
  PUBLIC_SEARCH_ARTIFACT_URL,
  isPublicSearchArtifact,
  searchPublicSearchArtifact,
} from "../../src/lib/search/public-search";

const artifact: PublicSearchArtifact = {
  version: 1,
  entries: [
    {
      id: "glossary/agent@en",
      canonicalId: "glossary/agent",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "glossary",
      url: "/glossary/agent",
      title: "Agent",
      description: "Definition of an AI agent in the factory documentation.",
      headings: ["What is an agent?"],
      body: "An agent is a model-guided worker that can act on tools and files.",
      tags: ["agent", "glossary"],
      section: "glossary",
      searchPriority: 9,
    },
    {
      id: "blog/introducing-factory@en",
      canonicalId: "blog/introducing-factory",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "blog",
      url: "/blog/introducing-factory",
      title: "Introducing Factory",
      description: "Launch notes for the docs experience.",
      headings: ["Search setup"],
      body: "This post mentions the agent workflow and launch details.",
      tags: ["launch"],
      aliases: ["factory launch"],
      section: "blog",
      searchPriority: 4,
    },
    {
      id: "doc/getting-started@fr",
      canonicalId: "doc/getting-started",
      locale: "fr",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      kind: "doc",
      url: "/docs/getting-started",
      title: "Commencer",
      description: "Guide de démarrage pour la documentation.",
      headings: ["Commencer"],
      body: "Commencer avec les docs du projet et les résultats localisés.",
      tags: ["docs", "guide"],
      section: "guides",
      searchPriority: 10,
    },
    {
      id: "doc/getting-started@en",
      canonicalId: "doc/getting-started",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      kind: "doc",
      url: "/docs/getting-started",
      title: "Getting started",
      description: "Quickstart guide for the documentation.",
      headings: ["Getting started"],
      body: "Getting started with the project docs and localized results.",
      tags: ["docs", "guide"],
      section: "guides",
      searchPriority: 10,
    },
    {
      id: "reference/agent-loops@en",
      canonicalId: "reference/agent-loops",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "reference",
      url: "/references/agent-loops",
      title: "Agent loops",
      description: "Reference details for recurring agent loops.",
      headings: ["Agent loops"],
      body: "Reference material about agent loops and execution details.",
      tags: ["agent", "reference"],
      section: "references",
      searchPriority: 6,
    },
  ],
};

describe("public search helpers", () => {
  test("uses a GitHub Pages base-path-aware artifact URL", () => {
    expect(PUBLIC_SEARCH_ARTIFACT_URL).toBe(
      "/you-agent-factory-docs/search/public-search-index.json",
    );
  });

  test("validates the generated public search artifact shape", () => {
    expect(isPublicSearchArtifact(artifact)).toBe(true);
    expect(
      isPublicSearchArtifact({
        version: 1,
        entries: [{ id: "broken-entry" }],
      }),
    ).toBe(false);
  });

  test("returns ranked matches with visible preview text", () => {
    const results = searchPublicSearchArtifact(artifact, "agent");

    expect(results).toHaveLength(3);
    expect(results[0]?.entry.id).toBe("glossary/agent@en");
    expect(results[0]?.preview).toContain("Definition of an AI agent");
    expect(results.map((result) => result.entry.id)).toEqual([
      "glossary/agent@en",
      "reference/agent-loops@en",
      "blog/introducing-factory@en",
    ]);
  });

  test("prefers the active locale variant for a canonical page", () => {
    const results = searchPublicSearchArtifact(artifact, "guide", {
      activeLocale: "fr",
    });

    expect(results.map((result) => result.entry.id)).toContain(
      "doc/getting-started@fr",
    );
    expect(results.map((result) => result.entry.id)).not.toContain(
      "doc/getting-started@en",
    );
    expect(results[0]?.entry.id).toBe("doc/getting-started@fr");
  });

  test("keeps relevant cross-kind matches when ranking for the active locale", () => {
    const results = searchPublicSearchArtifact(artifact, "agent", {
      activeLocale: "fr",
    });

    expect(new Set(results.map((result) => result.entry.kind))).toEqual(
      new Set(["glossary", "blog", "reference"]),
    );
  });

  test("returns an empty result set for blank or unmatched queries", () => {
    expect(searchPublicSearchArtifact(artifact, "")).toEqual([]);
    expect(searchPublicSearchArtifact(artifact, "not-present")).toEqual([]);
  });
});
