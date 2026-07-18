/**
 * W16 story 008: measure Orama static-search bootstrap payload bytes for
 * settled reference item documents and shipped locale catalogs.
 *
 * Pure measurement over already-parsed documents — does not write `out/`.
 * The export budget gate in `exported-site-budget.ts` remains the enforceable
 * CI ceiling for emitted `api/search*` artifacts.
 */

import { FACTORY_EXPORTED_SITE_BUDGET_BASELINES } from "@/lib/build/exported-site-budget";
import type { SiteLocale } from "@/lib/i18n/locale-routing";
import { exportAdvancedOramaFromDocuments } from "./create-search-catalog-from-documents";
import type { SearchDocument } from "./types";

/**
 * Serialized advanced-Orama bootstrap size for one locale catalog, matching
 * `emitExportSearchIndex` (`JSON.stringify(payload) + "\\n"`).
 */
export async function measureSearchBootstrapPayloadBytes(
  documents: readonly SearchDocument[],
): Promise<number> {
  const payload = await exportAdvancedOramaFromDocuments([...documents]);
  return Buffer.byteLength(`${JSON.stringify(payload)}\n`, "utf8");
}

export type ReferenceSearchBootstrapLocaleMeasurement = {
  locale: SiteLocale;
  documentCount: number;
  bootstrapBytes: number;
};

export type ReferenceSearchBootstrapMeasurement = {
  referenceItemDocumentCount: number;
  referenceItemBootstrapBytes: number;
  locales: ReferenceSearchBootstrapLocaleMeasurement[];
  totalLocaleBootstrapBytes: number;
  maxSearchBootstrapBytes: number;
  withinSearchBootstrapBudget: boolean;
};

/**
 * Measure reference-item-only payload plus each locale catalog’s emitted
 * bootstrap size, then compare the locale sum to the factory search budget.
 */
export async function measureReferenceSearchBootstrapPayload(input: {
  referenceItemDocuments: readonly SearchDocument[];
  documentsByLocale: ReadonlyMap<SiteLocale, readonly SearchDocument[]>;
  maxSearchBootstrapBytes?: number;
}): Promise<ReferenceSearchBootstrapMeasurement> {
  const maxSearchBootstrapBytes =
    input.maxSearchBootstrapBytes ??
    FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes;

  const referenceItemBootstrapBytes = await measureSearchBootstrapPayloadBytes(
    input.referenceItemDocuments,
  );

  const locales: ReferenceSearchBootstrapLocaleMeasurement[] = [];
  let totalLocaleBootstrapBytes = 0;

  for (const [locale, documents] of input.documentsByLocale) {
    const bootstrapBytes = await measureSearchBootstrapPayloadBytes(documents);
    totalLocaleBootstrapBytes += bootstrapBytes;
    locales.push({
      locale,
      documentCount: documents.length,
      bootstrapBytes,
    });
  }

  locales.sort((left, right) => left.locale.localeCompare(right.locale));

  return {
    referenceItemDocumentCount: input.referenceItemDocuments.length,
    referenceItemBootstrapBytes,
    locales,
    totalLocaleBootstrapBytes,
    maxSearchBootstrapBytes,
    withinSearchBootstrapBudget:
      totalLocaleBootstrapBytes <= maxSearchBootstrapBytes,
  };
}
