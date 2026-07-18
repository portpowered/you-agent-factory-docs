import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const INFERENCE_RUN_TYPE_PAGE_PATH =
  "/docs/workstations/inference-run" as const;
export const INFERENCE_RUN_TYPE_OVERLAY_ID =
  "workstation:INFERENCE_RUN" as const;

/**
 * Embeds the validated `workstation:INFERENCE_RUN` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function InferenceRunTypeVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationTypeOverlay("INFERENCE_RUN");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-inference-run-type-schema-embed=""
      data-overlay-id={INFERENCE_RUN_TYPE_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={INFERENCE_RUN_TYPE_PAGE_PATH}
        showEmptyExamples={false}
        data-testid="inference-run-type-variant-schema"
      />
    </div>
  );
}
