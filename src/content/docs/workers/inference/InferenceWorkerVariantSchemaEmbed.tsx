import { SchemaVariantReference } from "@/features/references/schema";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkerBaseSchemaEmbedModel } from "../load-worker-base-schema";

export const INFERENCE_WORKER_PAGE_PATH = "/docs/workers/inference" as const;
export const INFERENCE_WORKER_OVERLAY_ID = "worker:INFERENCE_WORKER" as const;

/**
 * Embeds the validated `worker:INFERENCE_WORKER` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function InferenceWorkerVariantSchemaEmbed() {
  const model = loadWorkerBaseSchemaEmbedModel();
  const overlay = createProductionWorkerOverlay("INFERENCE_WORKER");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-inference-worker-schema-embed=""
      data-overlay-id={INFERENCE_WORKER_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={INFERENCE_WORKER_PAGE_PATH}
        showEmptyExamples={false}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
        data-testid="inference-worker-variant-schema"
      />
    </div>
  );
}
