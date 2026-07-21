/**
 * Story refs-w16-search-anchor-projection-008 proof: measure/gate the expanded
 * static search bootstrap payload, and prove representative item-level queries
 * for operations, fields, variants/pages, events, commands, and tools.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 * Browser path: live `docsSearchApi.search` (same `/api/search` pipeline);
 * worktree Next/Turbopack often cannot start without local `node_modules`.
 */
import { describe, expect, test } from "bun:test";
import { FACTORY_EXPORTED_SITE_BUDGET_BASELINES } from "@/lib/build/exported-site-budget";
import {
  buildReferenceItemSearchDocuments,
  measureReferenceSearchBootstrapPayload,
  REFERENCE_SEARCH_DOCUMENT_KIND,
  resetReferenceItemSearchDocumentsCacheForTests,
} from "@/lib/search";
import { loadSearchDocumentsByLocale } from "@/lib/search/load-search-documents";
import { docsSearchApi } from "@/lib/search/search-server";

describe("factory search payload gate and representative queries (W16-008)", () => {
  test("measures reference + locale bootstrap payloads within the factory budget", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const referenceItemDocuments = buildReferenceItemSearchDocuments({
      fresh: true,
    });
    expect(referenceItemDocuments.length).toBeGreaterThan(0);

    const documentsByLocale = await loadSearchDocumentsByLocale({
      referenceItemDocuments,
    });

    const measurement = await measureReferenceSearchBootstrapPayload({
      referenceItemDocuments,
      documentsByLocale,
    });

    expect(measurement.referenceItemDocumentCount).toBe(
      referenceItemDocuments.length,
    );
    expect(measurement.referenceItemBootstrapBytes).toBeGreaterThan(0);
    expect(measurement.locales.map((entry) => entry.locale).sort()).toEqual([
      "en",
      "ja",
      "vi",
      "zh-CN",
    ]);
    expect(measurement.totalLocaleBootstrapBytes).toBeGreaterThan(
      measurement.referenceItemBootstrapBytes,
    );
    expect(measurement.maxSearchBootstrapBytes).toBe(
      FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes,
    );
    expect(measurement.withinSearchBootstrapBudget).toBe(true);

    // Measured 2026-07-18 UTC: ~29.69 MiB across en/ja/zh-CN/vi after W16
    // item projection; ceiling raised with this evidence (see budget module).
    expect(measurement.totalLocaleBootstrapBytes).toBeLessThanOrEqual(
      FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes,
    );
  });

  test("representative queries return item-level deep links across families", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const operation = await docsSearchApi.search("submitWorkBySessionId");
    expect(
      operation.some(
        (result) => result.url === "/docs/references/api#submitWorkBySessionId",
      ),
    ).toBe(true);

    const field = await docsSearchApi.search("workers");
    expect(
      field.some(
        (result) =>
          result.url.startsWith("/docs/references/factory-schema#") &&
          result.url.includes("#"),
      ),
    ).toBe(true);
    const fieldMeta = field.find((result) =>
      result.url.startsWith("/docs/references/factory-schema#"),
    );
    expect(fieldMeta).toBeDefined();
    expect(fieldMeta?.type).toBe("page");

    const workstationVariant = await docsSearchApi.search("Poller behavior");
    expect(
      workstationVariant.some(
        (result) => result.url === "/docs/workstations/poller",
      ),
    ).toBe(true);

    const event = await docsSearchApi.search("RUN_REQUEST");
    expect(
      event.some(
        (result) => result.url === "/docs/references/events#RUN_REQUEST",
      ),
    ).toBe(true);

    const command = await docsSearchApi.search("you config init");
    expect(
      command.some(
        (result) => result.url === "/docs/references/cli#you-config-init",
      ),
    ).toBe(true);

    const tool = await docsSearchApi.search("you.factory_session.get");
    expect(
      tool.some(
        (result) =>
          result.url ===
          "/docs/references/mcp-reference#you.factory_session.get",
      ),
    ).toBe(true);
  });

  test("representative item hits expose reference kind metadata", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const results = await docsSearchApi.search("RUN_REQUEST");
    const item = results.find(
      (result) => result.url === "/docs/references/events#RUN_REQUEST",
    );
    expect(item).toBeDefined();
    expect(item?.type).toBe("page");

    // Kind is resolved via document meta for the fragment URL.
    const documents = buildReferenceItemSearchDocuments();
    const document = documents.find(
      (entry) => entry.url === "/docs/references/events#RUN_REQUEST",
    );
    expect(document?.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
  });
});
