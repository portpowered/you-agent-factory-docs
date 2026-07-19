import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const MODEL_WORKSTATION_TYPE_PAGE_PATH =
  "/docs/workstations/model-workstation" as const;
export const MODEL_WORKSTATION_TYPE_OVERLAY_ID =
  "workstation:MODEL_WORKSTATION" as const;

/**
 * Embeds the validated `workstation:MODEL_WORKSTATION` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function ModelWorkstationTypeVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationTypeOverlay("MODEL_WORKSTATION");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-model-workstation-type-schema-embed=""
      data-overlay-id={MODEL_WORKSTATION_TYPE_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={MODEL_WORKSTATION_TYPE_PAGE_PATH}
        showEmptyExamples={false}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
        data-testid="model-workstation-type-variant-schema"
      />
    </div>
  );
}
