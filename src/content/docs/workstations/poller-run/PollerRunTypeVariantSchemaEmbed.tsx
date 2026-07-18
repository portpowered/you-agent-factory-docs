import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const POLLER_RUN_TYPE_PAGE_PATH =
  "/docs/workstations/poller-run" as const;
export const POLLER_RUN_TYPE_OVERLAY_ID = "workstation:POLLER_RUN" as const;

/**
 * Embeds the validated `workstation:POLLER_RUN` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function PollerRunTypeVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationTypeOverlay("POLLER_RUN");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-poller-run-type-schema-embed=""
      data-overlay-id={POLLER_RUN_TYPE_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={POLLER_RUN_TYPE_PAGE_PATH}
        showEmptyExamples={false}
        data-testid="poller-run-type-variant-schema"
      />
    </div>
  );
}
