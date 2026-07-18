/**
 * Maps a validated W06 Factory variant overlay onto W07
 * SchemaVariantOverlayPresentation (display-only applicability badges).
 *
 * Lives under workstations content ownership so variant pages can embed
 * overlays without rewriting shared validator or schema-renderer cores.
 */

import type { SchemaVariantOverlayPresentation } from "@/components/references/schema";
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
