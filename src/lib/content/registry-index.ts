import type {
  CitationRecord,
  ClassificationRecord,
  ConceptRecord,
  DatasetRecord,
  DocumentationRecord,
  GraphRecord,
  GuideRecord,
  OrganizationRecord,
  TagRecord,
  TechniqueRecord,
} from "./schemas";

export type RegistryRecord =
  | ConceptRecord
  | GuideRecord
  | TechniqueRecord
  | DocumentationRecord
  | ClassificationRecord
  | DatasetRecord
  | OrganizationRecord
  | TagRecord
  | CitationRecord
  | GraphRecord;

export type RegistryIndexes = {
  byId: Map<string, RegistryRecord>;
  bySlug: Map<string, RegistryRecord>;
  classificationsById: Map<string, ClassificationRecord>;
  tagsById: Map<string, TagRecord>;
  tagsBySlug: Map<string, TagRecord>;
};

export function getRegistryRecord(
  indexes: RegistryIndexes,
  registryId?: string,
): RegistryRecord | undefined {
  if (!registryId) {
    return undefined;
  }
  return indexes.byId.get(registryId);
}
