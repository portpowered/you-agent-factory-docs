/**
 * Incompatible variant field-selection detection (W06).
 *
 * Pure rules over overlay applicability + companion compatibility — no package
 * IO and no UI. A field path attributed only to an incompatible companion
 * variant must not appear in another overlay's selected set.
 *
 * Compatible companion combinations that jointly allow a field do not fail
 * solely because the field is also listed on a companion.
 */

import type {
  FactoryVariantFieldPath,
  FactoryVariantOverlayId,
  FactoryVariantOverlaySchema,
} from "./factory-variant-overlay-schema";
import { createFactoryVariantOverlay } from "./factory-variant-overlay-schema";

export type FactoryVariantIncompatibleFieldSelectionErrorCode =
  | "malformed-input"
  | "incompatible-field-selection";

export class FactoryVariantIncompatibleFieldSelectionError extends Error {
  readonly code: FactoryVariantIncompatibleFieldSelectionErrorCode;
  readonly overlayId?: string;
  readonly fieldPath?: string;
  readonly conflictingVariantId?: string;

  constructor(
    code: FactoryVariantIncompatibleFieldSelectionErrorCode,
    message: string,
    options: {
      overlayId?: string;
      fieldPath?: string;
      conflictingVariantId?: string;
      cause?: unknown;
    } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "FactoryVariantIncompatibleFieldSelectionError";
    this.code = code;
    this.overlayId = options.overlayId;
    this.fieldPath = options.fieldPath;
    this.conflictingVariantId = options.conflictingVariantId;
  }
}

/**
 * Field-path attribution derived from overlay `selected` applicability slots.
 * Paths map to the overlay IDs that claim them as variant-selected fields.
 */
export type FactoryVariantFieldAttribution = {
  byPath: ReadonlyMap<
    FactoryVariantFieldPath,
    ReadonlySet<FactoryVariantOverlayId>
  >;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Build field attribution from overlay `selected` slots.
 * Shared / excluded / conditional slots do not contribute ownership claims —
 * only explicit selection attributes a field to a variant for this check.
 */
export function buildFactoryVariantFieldAttribution(
  overlays: Iterable<FactoryVariantOverlaySchema>,
): FactoryVariantFieldAttribution {
  const mutable = new Map<
    FactoryVariantFieldPath,
    Set<FactoryVariantOverlayId>
  >();

  for (const raw of overlays) {
    if (
      !isPlainObject(raw) ||
      typeof raw.id !== "string" ||
      raw.id.length === 0
    ) {
      throw new FactoryVariantIncompatibleFieldSelectionError(
        "malformed-input",
        "Cannot build field attribution: each overlay must carry a non-empty id.",
        { fieldPath: "id" },
      );
    }
    const overlay = createFactoryVariantOverlay(raw);
    for (const path of overlay.fields.selected) {
      if (typeof path !== "string" || path.length === 0) {
        throw new FactoryVariantIncompatibleFieldSelectionError(
          "malformed-input",
          `Cannot build field attribution for overlay "${overlay.id}": selected paths must be non-empty strings.`,
          { overlayId: overlay.id, fieldPath: "fields.selected" },
        );
      }
      let owners = mutable.get(path);
      if (owners === undefined) {
        owners = new Set();
        mutable.set(path, owners);
      }
      owners.add(overlay.id);
    }
  }

  const byPath = new Map<
    FactoryVariantFieldPath,
    ReadonlySet<FactoryVariantOverlayId>
  >();
  for (const [path, owners] of mutable) {
    byPath.set(path, owners);
  }
  return { byPath };
}

/**
 * Look up overlay IDs that attribute a field path via `selected`.
 */
export function getFactoryVariantFieldAttributors(
  attribution: FactoryVariantFieldAttribution,
  path: FactoryVariantFieldPath,
): ReadonlySet<FactoryVariantOverlayId> {
  return attribution.byPath.get(path) ?? new Set();
}

/**
 * Validate that an overlay does not select fields attributed only to
 * incompatible companion variants.
 *
 * Rules:
 * - Attribution comes from `selected` slots across the overlay catalog.
 * - For each path in the overlay's own `selected` list, consider attributors
 *   other than the overlay itself.
 * - If every remaining attributor is absent from `companions.compatible`, the
 *   field belongs only to incompatible variants → fail closed.
 * - If any remaining attributor is a compatible companion, the combination
 *   jointly allows the field → do not fail solely because a companion also
 *   lists the field.
 * - Paths with no other attributors are allowed (the overlay may introduce or
 *   solely own the selection).
 *
 * Diagnostics name the overlay, field path, and conflicting variant identity.
 */
export function validateFactoryVariantIncompatibleFieldSelection(
  overlayInput: FactoryVariantOverlaySchema,
  attribution: FactoryVariantFieldAttribution,
): void {
  if (!isPlainObject(attribution) || !(attribution.byPath instanceof Map)) {
    throw new FactoryVariantIncompatibleFieldSelectionError(
      "malformed-input",
      "Cannot validate incompatible field selection: attribution.byPath must be a Map.",
      { fieldPath: "attribution.byPath" },
    );
  }

  const overlay = createFactoryVariantOverlay(overlayInput);
  const compatible = new Set(overlay.companions.compatible);

  for (const path of overlay.fields.selected) {
    const owners = getFactoryVariantFieldAttributors(attribution, path);
    const foreignOwners: FactoryVariantOverlayId[] = [];
    for (const ownerId of owners) {
      if (ownerId !== overlay.id) {
        foreignOwners.push(ownerId);
      }
    }

    if (foreignOwners.length === 0) {
      continue;
    }

    const jointlyAllowed = foreignOwners.some((ownerId) =>
      compatible.has(ownerId),
    );
    if (jointlyAllowed) {
      continue;
    }

    // Every foreign attributor is incompatible with this overlay.
    const conflictingVariantId = foreignOwners[0];
    if (conflictingVariantId === undefined) {
      continue;
    }

    throw new FactoryVariantIncompatibleFieldSelectionError(
      "incompatible-field-selection",
      `Overlay "${overlay.id}" selects field "${path}" that compatibility/applicability rules attribute only to incompatible companion variant "${conflictingVariantId}".`,
      {
        overlayId: overlay.id,
        fieldPath: path,
        conflictingVariantId,
      },
    );
  }
}

/**
 * Validate every overlay against field attribution built from the same set.
 * Stops at the first failure (fail closed).
 */
export function validateFactoryVariantOverlaysIncompatibleFieldSelection(
  overlays: Iterable<FactoryVariantOverlaySchema>,
): void {
  const list = [...overlays].map((entry) => createFactoryVariantOverlay(entry));
  const attribution = buildFactoryVariantFieldAttribution(list);
  for (const overlay of list) {
    validateFactoryVariantIncompatibleFieldSelection(overlay, attribution);
  }
}
