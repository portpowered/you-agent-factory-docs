import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkerBaseSchemaEmbedModel } from "../load-worker-base-schema";

export const AGENT_WORKER_PAGE_PATH = "/docs/workers/agent" as const;
export const AGENT_WORKER_OVERLAY_ID = "worker:AGENT_WORKER" as const;

/**
 * Embeds the validated `worker:AGENT_WORKER` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function AgentWorkerVariantSchemaEmbed() {
  const model = loadWorkerBaseSchemaEmbedModel();
  const overlay = createProductionWorkerOverlay("AGENT_WORKER");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-agent-worker-schema-embed=""
      data-overlay-id={AGENT_WORKER_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={AGENT_WORKER_PAGE_PATH}
        showEmptyExamples={false}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
        data-testid="agent-worker-variant-schema"
      />
    </div>
  );
}
