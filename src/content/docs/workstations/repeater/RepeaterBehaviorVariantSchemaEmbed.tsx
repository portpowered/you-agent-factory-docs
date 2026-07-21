import { SchemaVariantReference } from "@/features/references/schema";
import { createProductionWorkstationBehaviorOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const REPEATER_BEHAVIOR_PAGE_PATH =
  "/docs/workstations/repeater" as const;
export const REPEATER_BEHAVIOR_OVERLAY_ID = "behavior:REPEATER" as const;

/**
 * Embeds the validated `behavior:REPEATER` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function RepeaterBehaviorVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationBehaviorOverlay("REPEATER");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-repeater-behavior-schema-embed=""
      data-overlay-id={REPEATER_BEHAVIOR_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={REPEATER_BEHAVIOR_PAGE_PATH}
        showEmptyExamples={false}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
        data-testid="repeater-behavior-variant-schema"
      />
    </div>
  );
}
