import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkstationBehaviorOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const CRON_BEHAVIOR_PAGE_PATH = "/docs/workstations/cron" as const;
export const CRON_BEHAVIOR_OVERLAY_ID = "behavior:CRON" as const;

/**
 * Embeds the validated `behavior:CRON` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function CronBehaviorVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationBehaviorOverlay("CRON");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-cron-behavior-schema-embed=""
      data-overlay-id={CRON_BEHAVIOR_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={CRON_BEHAVIOR_PAGE_PATH}
        showEmptyExamples={false}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
        data-testid="cron-behavior-variant-schema"
      />
    </div>
  );
}
