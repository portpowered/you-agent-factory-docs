import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkerBaseSchemaEmbedModel } from "../load-worker-base-schema";

export const POLLER_WORKER_PAGE_PATH = "/docs/workers/poller" as const;
export const POLLER_WORKER_OVERLAY_ID = "worker:POLLER_WORKER" as const;

/**
 * Embeds the validated `worker:POLLER_WORKER` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function PollerWorkerVariantSchemaEmbed() {
  const model = loadWorkerBaseSchemaEmbedModel();
  const overlay = createProductionWorkerOverlay("POLLER_WORKER");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-poller-worker-schema-embed=""
      data-overlay-id={POLLER_WORKER_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={POLLER_WORKER_PAGE_PATH}
        showEmptyExamples={false}
        data-testid="poller-worker-variant-schema"
      />
    </div>
  );
}
