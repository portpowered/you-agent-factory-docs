import { createFactoryVariantSchemaEmbed } from "@/features/docs/components/FactoryVariantSchemaEmbed";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

/**
 * Embeds the validated `workstation:MODEL_WORKSTATION` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantSchemaEmbed} factory; only the values below vary
 * between variant pages.
 */
const embed = createFactoryVariantSchemaEmbed({
  id: "model-workstation-type",
  pagePath: "/docs/workstations/model-workstation",
  overlayId: "workstation:MODEL_WORKSTATION",
  loadDefinition: () => loadWorkstationBaseSchemaEmbedModel().definition,
  loadOverlay: () =>
    createProductionWorkstationTypeOverlay("MODEL_WORKSTATION"),
});

export const MODEL_WORKSTATION_TYPE_PAGE_PATH = embed.pagePath;
export const MODEL_WORKSTATION_TYPE_OVERLAY_ID = embed.overlayId;
export const ModelWorkstationTypeVariantSchemaEmbed = embed.Embed;
