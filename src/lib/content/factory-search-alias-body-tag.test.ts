/**
 * Story converge-factory-search-navigation-002 proof: alias, body-phrase, and
 * factory-tag queries find live factory pages without Atlas tags.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import { loadSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { docsSearchApi } from "@/lib/search/search-server";

const RETIRED_ATLAS_TAG_SLUGS = [
  "attention",
  "model-family",
  "inference",
  "alignment",
] as const;

const FACTORY_ALIAS_CASES = [
  {
    alias: "agent runtime",
    url: "/docs/concepts/harness",
  },
  {
    alias: "Ralph loop",
    url: "/docs/techniques/ralph",
  },
  {
    alias: "Quickstart",
    url: "/docs/guides/getting-started",
  },
  {
    alias: "draft-then-refine",
    url: "/docs/techniques/fusion",
  },
] as const;

const FACTORY_BODY_CASES = [
  {
    phrase: "one-story-per-iteration",
    url: "/docs/techniques/ralph",
  },
  {
    phrase: "saturated task queue",
    url: "/blog/bottlenecks",
  },
] as const;

const FACTORY_TAG_SLUG = "foundations";
const FACTORY_TAGGED_URL = "/blog/bottlenecks";

describe("factory search alias, body, and tag discovery", () => {
  test("indexed factory pages expose aliases used by discovery queries", async () => {
    const metaByUrl = await loadSearchResultMetaMap();

    for (const { alias, url } of FACTORY_ALIAS_CASES) {
      const meta = metaByUrl.get(url);
      expect(meta).toBeDefined();
      expect(meta?.directAliases ?? meta?.aliases).toEqual(
        expect.arrayContaining([alias]),
      );
    }
  });

  test(
    "known factory page aliases return the matching live pages",
    async () => {
      for (const { alias, url } of FACTORY_ALIAS_CASES) {
        const results = await docsSearchApi.search(alias);
        expect(
          results.some((result) => result.url === url),
          `expected ${url} for alias "${alias}"`,
        ).toBe(true);
        expect(results[0]?.url).toBe(url);
      }
    },
    { timeout: 20_000 },
  );

  test(
    "distinctive factory body phrases return the matching live pages",
    async () => {
      const metaByUrl = await loadSearchResultMetaMap();

      for (const { phrase, url } of FACTORY_BODY_CASES) {
        const meta = metaByUrl.get(url);
        expect(meta).toBeDefined();

        const results = await docsSearchApi.search(phrase);
        expect(
          results.some((result) => result.url === url),
          `expected ${url} for body phrase "${phrase}"`,
        ).toBe(true);
      }
    },
    { timeout: 20_000 },
  );

  test(
    "published factory tag queries return tagged pages without Atlas tags",
    async () => {
      const metaByUrl = await loadSearchResultMetaMap();
      const tagged = metaByUrl.get(FACTORY_TAGGED_URL);
      expect(tagged?.tags).toEqual(expect.arrayContaining([FACTORY_TAG_SLUG]));

      for (const atlasTag of RETIRED_ATLAS_TAG_SLUGS) {
        expect(tagged?.tags.includes(atlasTag)).toBe(false);
      }

      const tagFiltered = await docsSearchApi.search("bottlenecks", {
        tag: [FACTORY_TAG_SLUG],
      });
      expect(
        tagFiltered.some((result) => result.url === FACTORY_TAGGED_URL),
      ).toBe(true);
      for (const result of tagFiltered) {
        const meta = metaByUrl.get(result.url);
        expect(meta?.tags).toEqual(expect.arrayContaining([FACTORY_TAG_SLUG]));
        for (const atlasTag of RETIRED_ATLAS_TAG_SLUGS) {
          expect(meta?.tags.includes(atlasTag)).toBe(false);
        }
      }

      const tagAsQuery = await docsSearchApi.search(FACTORY_TAG_SLUG);
      expect(
        tagAsQuery.some((result) => result.url === FACTORY_TAGGED_URL),
      ).toBe(true);

      for (const atlasTag of RETIRED_ATLAS_TAG_SLUGS) {
        const atlasFiltered = await docsSearchApi.search("bottlenecks", {
          tag: [atlasTag],
        });
        expect(
          atlasFiltered.some((result) => result.url === FACTORY_TAGGED_URL),
        ).toBe(false);
      }
    },
    { timeout: 20_000 },
  );
});
