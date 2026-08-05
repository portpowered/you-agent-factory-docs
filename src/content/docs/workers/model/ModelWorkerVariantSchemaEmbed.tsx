import { createFactoryVariantSchemaEmbed } from "@/features/docs/components/FactoryVariantSchemaEmbed";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { loadWorkerBaseSchemaEmbedModel } from "../load-worker-base-schema";

/**
 * Embeds the validated `worker:MODEL_WORKER` overlay via W07
 * SchemaVariantReference. Authored minimal/misuse examples live in the page
 * Examples section (overlay carries exampleId refs only).
 *
 * Markup and `data-*` attributes come from the shared
 * {@link createFactoryVariantSchemaEmbed} factory; only the values below vary
 * between variant pages.
 */
const embed = createFactoryVariantSchemaEmbed({
  id: "model-worker",
  pagePath: "/docs/workers/model",
  overlayId: "worker:MODEL_WORKER",
  loadDefinition: () => loadWorkerBaseSchemaEmbedModel().definition,
  loadOverlay: () => createProductionWorkerOverlay("MODEL_WORKER"),
});

export const MODEL_WORKER_PAGE_PATH = embed.pagePath;
export const MODEL_WORKER_OVERLAY_ID = embed.overlayId;
export const ModelWorkerVariantSchemaEmbed = embed.Embed;
