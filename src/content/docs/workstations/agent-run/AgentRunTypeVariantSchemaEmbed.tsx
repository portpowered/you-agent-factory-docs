import { createFactoryVariantSchemaEmbed } from "@/features/docs/components/FactoryVariantSchemaEmbed";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

/**
 * Embeds the validated `workstation:AGENT_RUN` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantSchemaEmbed} factory; only the values below vary
 * between variant pages.
 */
const embed = createFactoryVariantSchemaEmbed({
  id: "agent-run-type",
  pagePath: "/docs/workstations/agent-run",
  overlayId: "workstation:AGENT_RUN",
  loadDefinition: () => loadWorkstationBaseSchemaEmbedModel().definition,
  loadOverlay: () => createProductionWorkstationTypeOverlay("AGENT_RUN"),
});

export const AGENT_RUN_TYPE_PAGE_PATH = embed.pagePath;
export const AGENT_RUN_TYPE_OVERLAY_ID = embed.overlayId;
export const AgentRunTypeVariantSchemaEmbed = embed.Embed;
