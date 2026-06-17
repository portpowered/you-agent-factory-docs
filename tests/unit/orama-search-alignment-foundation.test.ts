import { describe, expect, test } from "bun:test";
import {
  createPublicSearchOramaIndex,
  loadPublicSearchArtifact,
  searchPublicSearchOramaIndex,
} from "../../src/lib/content";

describe("orama search alignment foundation", () => {
  test("builds an Orama-backed index directly from the generated public search artifact", async () => {
    const artifact = loadPublicSearchArtifact();
    const index = await createPublicSearchOramaIndex(artifact);

    expect(index.artifactVersion).toBe(1);
    expect(index.artifactVersion).toBe(artifact.version);
    expect(index.documentCount).toBe(artifact.entries.length);

    const result = await searchPublicSearchOramaIndex(index, {
      term: "installation",
      locale: "en",
      limit: 5,
    });

    expect(result.count).toBeGreaterThan(0);
    expect(result.hits[0]?.entry).toMatchObject({
      locale: "en",
      canonicalId: "doc/installation",
      url: "/docs/installation",
      title: "Installation",
    });
  });

  test("preserves locale-aware artifact metadata through the Orama query seam", async () => {
    const artifact = loadPublicSearchArtifact();
    const index = await createPublicSearchOramaIndex(artifact);

    const frenchResult = await searchPublicSearchOramaIndex(index, {
      term: "Commencer",
      locale: "fr",
      limit: 5,
    });

    expect(frenchResult.count).toBeGreaterThan(0);
    expect(frenchResult.hits[0]?.entry).toMatchObject({
      id: "doc/getting-started@fr",
      canonicalId: "doc/getting-started",
      locale: "fr",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      url: "/docs/getting-started",
      title: "Commencer",
    });
  });

  test("returns no results for blank search terms without querying Orama", async () => {
    const artifact = loadPublicSearchArtifact();
    const index = await createPublicSearchOramaIndex(artifact);

    expect(
      await searchPublicSearchOramaIndex(index, {
        term: "   ",
        locale: "en",
      }),
    ).toEqual({
      count: 0,
      hits: [],
    });
  });
});
