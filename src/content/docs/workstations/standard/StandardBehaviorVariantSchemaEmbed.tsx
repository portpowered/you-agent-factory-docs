import { createFactoryVariantSchemaEmbed } from "@/features/docs/components/FactoryVariantSchemaEmbed";
import { createProductionWorkstationBehaviorOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

/**
 * Embeds the validated `behavior:STANDARD` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantSchemaEmbed} factory; only the values below vary
 * between variant pages.
 */
const embed = createFactoryVariantSchemaEmbed({
  id: "standard-behavior",
  pagePath: "/docs/workstations/standard",
  overlayId: "behavior:STANDARD",
  loadDefinition: () => loadWorkstationBaseSchemaEmbedModel().definition,
  loadOverlay: () => createProductionWorkstationBehaviorOverlay("STANDARD"),
});

export const STANDARD_BEHAVIOR_PAGE_PATH = embed.pagePath;
export const STANDARD_BEHAVIOR_OVERLAY_ID = embed.overlayId;
export const StandardBehaviorVariantSchemaEmbed = embed.Embed;
