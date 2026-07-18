import { describe, expect, test } from "bun:test";
import { FACTORY_EXPORTED_SITE_BUDGET_BASELINES } from "@/lib/build/exported-site-budget";
import type { SiteLocale } from "@/lib/i18n/locale-routing";
import {
  measureReferenceSearchBootstrapPayload,
  measureSearchBootstrapPayloadBytes,
} from "./measure-reference-search-bootstrap-payload";
import { EMPTY_SEARCH_DOCUMENT_TOPOLOGY, type SearchDocument } from "./types";

function fixtureDocument(
  overrides: Partial<SearchDocument> & Pick<SearchDocument, "id" | "url">,
): SearchDocument {
  return {
    kind: "reference",
    title: overrides.title ?? overrides.id,
    description: "",
    bodyText: "",
    headings: [],
    aliases: [],
    directAliases: [],
    tags: ["reference"],
    relatedIds: [],
    facets: { kind: "reference", tags: ["reference"] },
    topology: EMPTY_SEARCH_DOCUMENT_TOPOLOGY,
    ...overrides,
  };
}

describe("measure-reference-search-bootstrap-payload", () => {
  test("serializes advanced Orama export bytes for a document set", async () => {
    const bytes = await measureSearchBootstrapPayloadBytes([
      fixtureDocument({
        id: "ref:fixture",
        url: "/docs/references/events#FIXTURE",
        title: "FIXTURE",
      }),
    ]);
    expect(bytes).toBeGreaterThan(0);
  });

  test("sums locale catalog payloads and compares to the factory budget", async () => {
    const referenceItemDocuments = [
      fixtureDocument({
        id: "ref:a",
        url: "/docs/references/api#a",
        title: "a",
      }),
    ];
    const documentsByLocale = new Map<SiteLocale, SearchDocument[]>([
      ["en", [...referenceItemDocuments]],
      ["ja", [...referenceItemDocuments]],
    ]);

    const measurement = await measureReferenceSearchBootstrapPayload({
      referenceItemDocuments,
      documentsByLocale,
      maxSearchBootstrapBytes:
        FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes,
    });

    expect(measurement.referenceItemDocumentCount).toBe(1);
    expect(measurement.referenceItemBootstrapBytes).toBeGreaterThan(0);
    expect(measurement.locales).toHaveLength(2);
    expect(measurement.totalLocaleBootstrapBytes).toBe(
      measurement.locales.reduce(
        (sum, locale) => sum + locale.bootstrapBytes,
        0,
      ),
    );
    expect(measurement.maxSearchBootstrapBytes).toBe(
      FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes,
    );
    expect(measurement.withinSearchBootstrapBudget).toBe(true);
  });

  test("reports over-budget when the ceiling is below measured bytes", async () => {
    const referenceItemDocuments = [
      fixtureDocument({
        id: "ref:b",
        url: "/docs/references/cli#b",
        title: "b",
      }),
    ];
    const documentsByLocale = new Map<SiteLocale, SearchDocument[]>([
      ["en", [...referenceItemDocuments]],
    ]);

    const measurement = await measureReferenceSearchBootstrapPayload({
      referenceItemDocuments,
      documentsByLocale,
      maxSearchBootstrapBytes: 1,
    });

    expect(measurement.withinSearchBootstrapBudget).toBe(false);
    expect(measurement.totalLocaleBootstrapBytes).toBeGreaterThan(1);
  });
});
