import { createFactoryVariantSchemaEmbed } from "@/features/docs/components/FactoryVariantSchemaEmbed";
import { createProductionWorkstationBehaviorOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { loadWorkstationBaseSchemaEmbedModel } from "../load-workstation-base-schema";

/**
 * Embeds the validated `behavior:REPEATER` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantSchemaEmbed} factory; only the values below vary
 * between variant pages.
 */
const embed = createFactoryVariantSchemaEmbed({
  id: "repeater-behavior",
  pagePath: "/docs/workstations/repeater",
  overlayId: "behavior:REPEATER",
  loadDefinition: () => loadWorkstationBaseSchemaEmbedModel().definition,
  loadOverlay: () => createProductionWorkstationBehaviorOverlay("REPEATER"),
});

export const REPEATER_BEHAVIOR_PAGE_PATH = embed.pagePath;
export const REPEATER_BEHAVIOR_OVERLAY_ID = embed.overlayId;
export const RepeaterBehaviorVariantSchemaEmbed = embed.Embed;
