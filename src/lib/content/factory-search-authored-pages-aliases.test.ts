/**
 * Story refs-w16-search-anchor-projection-005 proof: authored factory /
 * worker / workstation pages stay normal page documents, and reference
 * item aliases cover common names plus literal discriminator values.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import {
  buildReferenceItemSearchDocuments,
  REFERENCE_SEARCH_DOCUMENT_KIND,
  resetReferenceItemSearchDocumentsCacheForTests,
} from "@/lib/search";
import { loadSearchDocumentsForLocale } from "@/lib/search/load-search-documents";
import { querySearchDocuments } from "@/lib/search/orama-index";

const AUTHORED_PAGE_PREFIXES = [
  "/docs/factories/",
  "/docs/workers/",
  "/docs/workstations/",
] as const;

describe("factory search authored pages and reference aliases (W16-005)", () => {
  test("authored factories/workers/workstations pages remain normal page documents", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const documents = await loadSearchDocumentsForLocale("en");

    const authored = documents.filter((document) =>
      AUTHORED_PAGE_PREFIXES.some((prefix) => document.url.startsWith(prefix)),
    );
    expect(authored.length).toBeGreaterThan(0);

    for (const document of authored) {
      expect(document.url.includes("#")).toBe(false);
      expect(document.kind).not.toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
      expect(document.kind).toBe("documentation");
    }

    expect(
      authored.some((document) => document.url === "/docs/factories/sessions"),
    ).toBe(true);
    expect(
      authored.some((document) => document.url === "/docs/workers/agent"),
    ).toBe(true);
    expect(
      authored.some((document) => document.url === "/docs/workstations/poller"),
    ).toBe(true);
  });

  test("reference item documents include common-name and discriminator aliases", () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const documents = buildReferenceItemSearchDocuments({ fresh: true });

    const runRequest = documents.find(
      (document) => document.url === "/docs/references/events#RUN_REQUEST",
    );
    expect(runRequest).toBeDefined();
    if (runRequest === undefined) {
      throw new Error("expected RUN_REQUEST event item document");
    }

    // Literal FactoryEvent.type discriminator + common payload schema name.
    expect(runRequest.aliases).toEqual(
      expect.arrayContaining(["RUN_REQUEST", "RunRequestEventPayload"]),
    );
    expect(runRequest.directAliases).toEqual(
      expect.arrayContaining(["RUN_REQUEST", "RunRequestEventPayload"]),
    );
  });

  test("representative authored-page and alias queries return the expected documents", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const documents = await loadSearchDocumentsForLocale("en");

    const pageHits = await querySearchDocuments(documents, "Poller behavior");
    expect(
      pageHits.some((hit) => hit.url === "/docs/workstations/poller"),
    ).toBe(true);

    const aliasHits = await querySearchDocuments(
      documents,
      "RunRequestEventPayload",
    );
    expect(
      aliasHits.some(
        (hit) => hit.url === "/docs/references/events#RUN_REQUEST",
      ),
    ).toBe(true);

    const discriminatorHits = await querySearchDocuments(
      documents,
      "RUN_REQUEST",
    );
    expect(
      discriminatorHits.some(
        (hit) => hit.url === "/docs/references/events#RUN_REQUEST",
      ),
    ).toBe(true);
  });
});
