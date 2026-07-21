import { SchemaVariantReference } from "@/features/references/schema";
import { createProductionWorkstationBehaviorOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const STANDARD_BEHAVIOR_PAGE_PATH =
  "/docs/workstations/standard" as const;
export const STANDARD_BEHAVIOR_OVERLAY_ID = "behavior:STANDARD" as const;

/**
 * Embeds the validated `behavior:STANDARD` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function StandardBehaviorVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationBehaviorOverlay("STANDARD");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-standard-behavior-schema-embed=""
      data-overlay-id={STANDARD_BEHAVIOR_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={STANDARD_BEHAVIOR_PAGE_PATH}
        showEmptyExamples={false}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
        data-testid="standard-behavior-variant-schema"
      />
    </div>
  );
}
