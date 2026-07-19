import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const LOGICAL_MOVE_TYPE_PAGE_PATH =
  "/docs/workstations/logical-move" as const;
export const LOGICAL_MOVE_TYPE_OVERLAY_ID = "workstation:LOGICAL_MOVE" as const;

/**
 * Embeds the validated `workstation:LOGICAL_MOVE` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function LogicalMoveTypeVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationTypeOverlay("LOGICAL_MOVE");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-logical-move-type-schema-embed=""
      data-overlay-id={LOGICAL_MOVE_TYPE_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={LOGICAL_MOVE_TYPE_PAGE_PATH}
        showEmptyExamples={false}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
        data-testid="logical-move-type-variant-schema"
      />
    </div>
  );
}
