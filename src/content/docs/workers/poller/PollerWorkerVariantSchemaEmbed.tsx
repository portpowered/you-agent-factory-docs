import { createFactoryVariantSchemaEmbed } from "@/features/docs/components/FactoryVariantSchemaEmbed";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { loadWorkerBaseSchemaEmbedModel } from "../load-worker-base-schema";

/**
 * Embeds the validated `worker:POLLER_WORKER` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantSchemaEmbed} factory; only the values below vary
 * between variant pages.
 */
const embed = createFactoryVariantSchemaEmbed({
  id: "poller-worker",
  pagePath: "/docs/workers/poller",
  overlayId: "worker:POLLER_WORKER",
  loadDefinition: () => loadWorkerBaseSchemaEmbedModel().definition,
  loadOverlay: () => createProductionWorkerOverlay("POLLER_WORKER"),
});

export const POLLER_WORKER_PAGE_PATH = embed.pagePath;
export const POLLER_WORKER_OVERLAY_ID = embed.overlayId;
export const PollerWorkerVariantSchemaEmbed = embed.Embed;
