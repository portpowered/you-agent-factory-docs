import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkstationBehaviorOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const POLLER_BEHAVIOR_PAGE_PATH = "/docs/workstations/poller" as const;
export const POLLER_BEHAVIOR_OVERLAY_ID = "behavior:POLLER" as const;

/**
 * Embeds the validated `behavior:POLLER` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function PollerBehaviorVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationBehaviorOverlay("POLLER");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-poller-behavior-schema-embed=""
      data-overlay-id={POLLER_BEHAVIOR_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={POLLER_BEHAVIOR_PAGE_PATH}
        showEmptyExamples={false}
        data-testid="poller-behavior-variant-schema"
      />
    </div>
  );
}
