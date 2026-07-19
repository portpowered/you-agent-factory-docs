import { SchemaVariantReference } from "@/components/references/schema";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

export const AGENT_RUN_TYPE_PAGE_PATH = "/docs/workstations/agent-run" as const;
export const AGENT_RUN_TYPE_OVERLAY_ID = "workstation:AGENT_RUN" as const;

/**
 * Embeds the validated `workstation:AGENT_RUN` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 */
export function AgentRunTypeVariantSchemaEmbed() {
  const model = loadWorkstationBaseSchemaEmbedModel();
  const overlay = createProductionWorkstationTypeOverlay("AGENT_RUN");
  const presentation =
    factoryVariantOverlayToSchemaVariantPresentation(overlay);

  return (
    <div
      className="min-w-0 space-y-3"
      data-agent-run-type-schema-embed=""
      data-overlay-id={AGENT_RUN_TYPE_OVERLAY_ID}
      data-discriminator={overlay.discriminator.value}
    >
      <SchemaVariantReference
        definition={model.definition}
        overlay={presentation}
        pagePath={AGENT_RUN_TYPE_PAGE_PATH}
        showEmptyExamples={false}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
        data-testid="agent-run-type-variant-schema"
      />
    </div>
  );
}
