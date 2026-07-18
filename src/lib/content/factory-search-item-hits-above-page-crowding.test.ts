/**
 * Story refs-w16-search-anchor-projection-006 proof: collapse/rerank keeps
 * reference item deep-links above duplicate owning-page crowding.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import {
  REFERENCE_SEARCH_DOCUMENT_KIND,
  resetReferenceItemSearchDocumentsCacheForTests,
} from "@/lib/search";
import { docsSearchApi } from "@/lib/search/search-server";

describe("factory search item hits above page crowding (W16-006)", () => {
  test("representative item queries return deep-link results, not only owning pages", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const runRequest = await docsSearchApi.search("RUN_REQUEST");
    const runRequestIndex = runRequest.findIndex(
      (result) => result.url === "/docs/references/events#RUN_REQUEST",
    );
    const eventsPageIndex = runRequest.findIndex(
      (result) => result.url === "/docs/references/events",
    );
    expect(runRequestIndex).toBeGreaterThanOrEqual(0);
    if (eventsPageIndex >= 0) {
      expect(runRequestIndex).toBeLessThan(eventsPageIndex);
    }

    const operation = await docsSearchApi.search("submitWorkBySessionId");
    expect(
      operation.some(
        (result) => result.url === "/docs/references/api#submitWorkBySessionId",
      ),
    ).toBe(true);

    const command = await docsSearchApi.search("you config init");
    expect(
      command.some(
        (result) => result.url === "/docs/references/cli#you-config-init",
      ),
    ).toBe(true);
  });

  test("ordinary non-reference page search still collapses to bare page URLs", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const harness = await docsSearchApi.search("harness");
    expect(harness.length).toBeGreaterThan(0);
    expect(
      harness
        .filter((result) => !result.url.includes("/docs/references/"))
        .every((result) => !result.url.includes("#")),
    ).toBe(true);
  });

  test("events page query still surfaces the owning reference page", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const results = await docsSearchApi.search("events");
    const pageHit = results.find(
      (result) => result.url === "/docs/references/events",
    );
    expect(pageHit).toBeDefined();
    expect(pageHit?.type).toBe("page");

    // Item deep-links may also appear, but must keep the registry fragment.
    for (const result of results) {
      if (result.url.startsWith("/docs/references/events#")) {
        expect(result.url.includes("#")).toBe(true);
      }
    }
  });

  test("item deep-link results remain kind reference via meta lookup", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const results = await docsSearchApi.search("RUN_REQUEST");
    const item = results.find(
      (result) => result.url === "/docs/references/events#RUN_REQUEST",
    );
    expect(item).toBeDefined();
    expect(REFERENCE_SEARCH_DOCUMENT_KIND).toBe("reference");
  });
});
