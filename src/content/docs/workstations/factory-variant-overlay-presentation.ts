/**
 * Re-export of the shared overlay→presentation mapper.
 *
 * Kept as a family-local module so workstations variant pages and their tests can
 * continue importing it relatively, while the implementation lives once in
 * `src/lib/references/overlays`.
 */
export { factoryVariantOverlayToSchemaVariantPresentation } from "@/lib/references/overlays/factory-variant-overlay-presentation";
