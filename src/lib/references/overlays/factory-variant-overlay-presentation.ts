/**
 * Maps a validated W06 Factory variant overlay onto W07
 * SchemaVariantOverlayPresentation (display-only applicability badges).
 *
 * Shared by the workers and workstations families, which previously kept two
 * byte-identical copies of this function under their own content directories.
 */

import type { SchemaVariantOverlayPresentation } from "@/features/references/schema";
import type { FactoryVariantOverlaySchema } from "@/lib/references/overlays/factory-variant-overlay-schema";

/**
 * Project overlay field slots into SchemaVariantReference presentation.
 * Shared paths stay unannotated (base schema prose remains authoritative).
 * Conditional `conditionId` values are identities, not reader-facing hints.
 */
export function factoryVariantOverlayToSchemaVariantPresentation(
  overlay: FactoryVariantOverlaySchema,
): SchemaVariantOverlayPresentation {
  return {
    variantLabel: String(overlay.discriminator.value),
    fields: [
      ...overlay.fields.selected.map((path) => ({
        path,
        applicability: "selected" as const,
      })),
      ...overlay.fields.excluded.map((path) => ({
        path,
        applicability: "excluded" as const,
      })),
      ...overlay.fields.conditional.map((entry) => ({
        path: entry.path,
        applicability: "conditional" as const,
      })),
    ],
  };
}
