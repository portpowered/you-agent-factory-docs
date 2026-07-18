import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const CLASSIFIER_TYPE_PAGE_PATH =
  "/docs/workstations/classifier" as const;
export const CLASSIFIER_TYPE_OVERLAY_ID =
  "workstation:CLASSIFIER_WORKSTATION" as const;

/**
 * Embeds the validated `workstation:CLASSIFIER_WORKSTATION` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function ClassifierTypeVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationTypeOverlay(
    "CLASSIFIER_WORKSTATION",
  );
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-classifier-type-schema-embed=""
      data-overlay-id={CLASSIFIER_TYPE_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={CLASSIFIER_TYPE_PAGE_PATH}
        showEmptyExamples={false}
        data-testid="classifier-type-variant-schema"
      />
    </div>
  );
}
