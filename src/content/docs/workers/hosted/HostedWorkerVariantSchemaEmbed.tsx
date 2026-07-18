import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkerBaseSchemaEmbedModel } from "../load-worker-base-schema";

export const HOSTED_WORKER_PAGE_PATH = "/docs/workers/hosted" as const;
export const HOSTED_WORKER_OVERLAY_ID = "worker:HOSTED_WORKER" as const;

/**
 * Embeds the validated `worker:HOSTED_WORKER` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function HostedWorkerVariantSchemaEmbed() {
  const model = loadWorkerBaseSchemaEmbedModel();
  const overlay = createProductionWorkerOverlay("HOSTED_WORKER");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-hosted-worker-schema-embed=""
      data-overlay-id={HOSTED_WORKER_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={HOSTED_WORKER_PAGE_PATH}
        showEmptyExamples={false}
        data-testid="hosted-worker-variant-schema"
      />
    </div>
  );
}
