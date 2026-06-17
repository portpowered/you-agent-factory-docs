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

    expect(results).toHaveLength(2);
    expect(results[0]?.entry.id).toBe("glossary/agent@en");
    expect(results[0]?.preview).toContain("Definition of an AI agent");
    expect(results[1]?.entry.id).toBe("blog/introducing-factory@en");
  });

  test("returns an empty result set for blank or unmatched queries", () => {
    expect(searchPublicSearchArtifact(artifact, "")).toEqual([]);
    expect(searchPublicSearchArtifact(artifact, "not-present")).toEqual([]);
  });
});
