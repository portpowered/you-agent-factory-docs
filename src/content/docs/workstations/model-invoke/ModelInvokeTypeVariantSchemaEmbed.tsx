import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const MODEL_INVOKE_TYPE_PAGE_PATH =
  "/docs/workstations/model-invoke" as const;
export const MODEL_INVOKE_TYPE_OVERLAY_ID = "workstation:MODEL_INVOKE" as const;

/**
 * Embeds the validated `workstation:MODEL_INVOKE` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function ModelInvokeTypeVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationTypeOverlay("MODEL_INVOKE");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-model-invoke-type-schema-embed=""
      data-overlay-id={MODEL_INVOKE_TYPE_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={MODEL_INVOKE_TYPE_PAGE_PATH}
        showEmptyExamples={false}
        data-testid="model-invoke-type-variant-schema"
      />
    </div>
  );
}
