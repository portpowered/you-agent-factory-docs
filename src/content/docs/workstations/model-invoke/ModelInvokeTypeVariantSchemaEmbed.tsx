import { createFactoryVariantSchemaEmbed } from "@/features/docs/components/FactoryVariantSchemaEmbed";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

/**
 * Embeds the validated `workstation:MODEL_INVOKE` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantSchemaEmbed} factory; only the values below vary
 * between variant pages.
 */
const embed = createFactoryVariantSchemaEmbed({
  id: "model-invoke-type",
  pagePath: "/docs/workstations/model-invoke",
  overlayId: "workstation:MODEL_INVOKE",
  loadDefinition: () => loadWorkstationBaseSchemaEmbedModel().definition,
  loadOverlay: () => createProductionWorkstationTypeOverlay("MODEL_INVOKE"),
});

export const MODEL_INVOKE_TYPE_PAGE_PATH = embed.pagePath;
export const MODEL_INVOKE_TYPE_OVERLAY_ID = embed.overlayId;
export const ModelInvokeTypeVariantSchemaEmbed = embed.Embed;
