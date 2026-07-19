import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const SCRIPT_RUN_TYPE_PAGE_PATH =
  "/docs/workstations/script-run" as const;
export const SCRIPT_RUN_TYPE_OVERLAY_ID = "workstation:SCRIPT_RUN" as const;

/**
 * Embeds the validated `workstation:SCRIPT_RUN` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function ScriptRunTypeVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationTypeOverlay("SCRIPT_RUN");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-script-run-type-schema-embed=""
      data-overlay-id={SCRIPT_RUN_TYPE_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={SCRIPT_RUN_TYPE_PAGE_PATH}
        showEmptyExamples={false}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
        data-testid="script-run-type-variant-schema"
      />
    </div>
  );
}
