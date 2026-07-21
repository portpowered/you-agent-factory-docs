import { SchemaReference } from "@/features/references/schema";
import {
  loadWorkstationBaseSchemaEmbedModel,
  WORKSTATION_BASE_DEFINITION_POINTER,
} from "./load-workstation-base-schema";
import { WORKSTATIONS_FAMILY_INDEX_PATH } from "./load-workstations-family-index";

/**
 * Embeds the live Factory `Workstation` base definition via W07 SchemaReference.
 * Exhaustive field lookup links out to the planned factory-schema reference.
 */
export function WorkstationBaseSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();

  return (
    <div
      className="min-w-0 space-y-3"
      data-workstations-family-schema-embed=""
      data-workstation-pointer={WORKSTATION_BASE_DEFINITION_POINTER}
    >
      <SchemaReference
        address={model.address}
        definition={model.definition}
        definitions={model.definitions}
        pagePath={WORKSTATIONS_FAMILY_INDEX_PATH}
        root={model.root}
        showCatalog={false}
        showEmptyExamples={false}
        showFilter={false}
        data-testid="workstations-family-workstation-schema"
      />
    </div>
  );
}
