import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkerBaseSchemaEmbedModel } from "../load-worker-base-schema";

export const SCRIPT_WORKER_PAGE_PATH = "/docs/workers/script" as const;
export const SCRIPT_WORKER_OVERLAY_ID = "worker:SCRIPT_WORKER" as const;

/**
 * Embeds the validated `worker:SCRIPT_WORKER` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function ScriptWorkerVariantSchemaEmbed() {
  const model = loadWorkerBaseSchemaEmbedModel();
  const overlay = createProductionWorkerOverlay("SCRIPT_WORKER");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-script-worker-schema-embed=""
      data-overlay-id={SCRIPT_WORKER_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={SCRIPT_WORKER_PAGE_PATH}
        showEmptyExamples={false}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
        data-testid="script-worker-variant-schema"
      />
    </div>
  );
}
