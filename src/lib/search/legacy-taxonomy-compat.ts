import type { RegistryRecord } from "@/lib/content/registry";
import type { ConceptRecord } from "@/lib/content/schemas";
import type { SearchDocumentFacets, SearchDocumentTopology } from "./types";

type LegacySearchTaxonomyCompatibilityFacets = Pick<
  SearchDocumentFacets,
  "legacyConceptType"
>;

function isConceptRecord(record: RegistryRecord): record is ConceptRecord {
  return record.kind === "concept";
}

export function resolveLegacySearchTaxonomyCompatibility(
  registryRecord: RegistryRecord | undefined,
  _topology: SearchDocumentTopology,
): LegacySearchTaxonomyCompatibilityFacets {
  if (!registryRecord || !isConceptRecord(registryRecord)) {
    return {};
  }

  return {
    legacyConceptType: registryRecord.conceptType,
  };
}
