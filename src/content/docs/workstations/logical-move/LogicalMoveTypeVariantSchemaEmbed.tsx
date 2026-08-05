import { createFactoryVariantSchemaEmbed } from "@/features/docs/components/FactoryVariantSchemaEmbed";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

/**
 * Embeds the validated `workstation:LOGICAL_MOVE` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantSchemaEmbed} factory; only the values below vary
 * between variant pages.
 */
const embed = createFactoryVariantSchemaEmbed({
  id: "logical-move-type",
  pagePath: "/docs/workstations/logical-move",
  overlayId: "workstation:LOGICAL_MOVE",
  loadDefinition: () => loadWorkstationBaseSchemaEmbedModel().definition,
  loadOverlay: () => createProductionWorkstationTypeOverlay("LOGICAL_MOVE"),
});

export const LOGICAL_MOVE_TYPE_PAGE_PATH = embed.pagePath;
export const LOGICAL_MOVE_TYPE_OVERLAY_ID = embed.overlayId;
export const LogicalMoveTypeVariantSchemaEmbed = embed.Embed;
