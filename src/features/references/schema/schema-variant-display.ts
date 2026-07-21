/**
 * Pure SchemaVariantReference display projectors.
 *
 * Accepts overlay-*shaped* presentation data for selected / excluded /
 * conditional field applicability. Does not validate Worker/Workstation
 * overlays, fixtures, or W06 migration rules — display adaptation only.
 */

import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import {
  SCHEMA_UI_STATUS_DEFAULT_MESSAGES,
  SCHEMA_UI_STATUS_DEFAULT_TITLES,
  type SchemaFieldTreeNode,
  type SchemaUiStatus,
  type SchemaUiStatusKind,
} from "./types";

export const SCHEMA_VARIANT_FIELD_APPLICABILITIES = [
  "selected",
  "excluded",
  "conditional",
] as const;

export type SchemaVariantFieldApplicability =
  (typeof SCHEMA_VARIANT_FIELD_APPLICABILITIES)[number];

/**
 * Per-field overlay presentation. Paths match `SchemaFieldModel.path` on the
 * base definition. Hints are display-only and never replace field descriptions.
 */
export type SchemaVariantFieldPresentation = {
  path: string;
  applicability: SchemaVariantFieldApplicability;
  /** Optional condition / note text for the badge row (not contract prose). */
  hint?: string;
};

/**
 * Minimal overlay-shaped presentation payload for variant display.
 * Callers that already ran W06 validation pass the display slice here.
 */
export type SchemaVariantOverlayPresentation = {
  /** Human-readable variant label (for example `AGENT_WORKER`). */
  variantLabel?: string;
  fields: readonly SchemaVariantFieldPresentation[];
};

export type SchemaVariantReadyResolution = {
  status: "ready";
  definition: SchemaDefinitionModel;
  overlay: SchemaVariantOverlayPresentation;
  /** Path → presentation for matching base fields. */
  applicabilityByPath: ReadonlyMap<string, SchemaVariantFieldPresentation>;
};

export type SchemaVariantStatusResolution = {
  status: SchemaUiStatusKind;
  title: string;
  message: string;
};

export type SchemaVariantResolution =
  | SchemaVariantReadyResolution
  | SchemaVariantStatusResolution;

export type ResolveSchemaVariantInput = {
  status?: SchemaUiStatus;
  statusTitle?: string;
  statusMessage?: string;
  /** Base definition whose field contract prose/types remain authoritative. */
  definition?: SchemaDefinitionModel;
  /** Overlay-shaped presentation (selected/excluded/conditional). */
  overlay?: SchemaVariantOverlayPresentation | null;
};

const MISSING_OVERLAY_TITLE = "Invalid overlay";
const MISSING_OVERLAY_MESSAGE =
  "Overlay-shaped presentation data is missing or incomplete for display.";
const EMPTY_OVERLAY_TITLE = "Empty variant";
const EMPTY_OVERLAY_MESSAGE =
  "No overlay field applicability entries are available to display.";
const EMPTY_BASE_TITLE = SCHEMA_UI_STATUS_DEFAULT_TITLES.empty;
const EMPTY_BASE_MESSAGE =
  "No base schema definition is available for variant display.";

const APPLICABILITY_LABELS: Record<SchemaVariantFieldApplicability, string> = {
  selected: "Selected",
  excluded: "Excluded",
  conditional: "Conditional",
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSchemaVariantFieldApplicability(
  value: unknown,
): value is SchemaVariantFieldApplicability {
  return (
    typeof value === "string" &&
    (SCHEMA_VARIANT_FIELD_APPLICABILITIES as readonly string[]).includes(value)
  );
}

/** Text label for applicability badges (never color-only meaning). */
export function schemaVariantApplicabilityLabel(
  applicability: SchemaVariantFieldApplicability,
): string {
  return APPLICABILITY_LABELS[applicability];
}

/**
 * Structural check for overlay-shaped presentation. This is a display guard,
 * not a W06 overlay validator.
 */
export function isSchemaVariantOverlayPresentation(
  value: unknown,
): value is SchemaVariantOverlayPresentation {
  if (!isPlainObject(value)) {
    return false;
  }
  if (!Array.isArray(value.fields)) {
    return false;
  }
  if (
    value.variantLabel !== undefined &&
    typeof value.variantLabel !== "string"
  ) {
    return false;
  }
  for (const entry of value.fields) {
    if (!isPlainObject(entry)) {
      return false;
    }
    if (typeof entry.path !== "string" || entry.path.trim().length === 0) {
      return false;
    }
    if (!isSchemaVariantFieldApplicability(entry.applicability)) {
      return false;
    }
    if (entry.hint !== undefined && typeof entry.hint !== "string") {
      return false;
    }
  }
  return true;
}

/** Index overlay field entries by path (last entry wins on duplicates). */
export function indexSchemaVariantFieldApplicability(
  fields: readonly SchemaVariantFieldPresentation[],
): Map<string, SchemaVariantFieldPresentation> {
  const byPath = new Map<string, SchemaVariantFieldPresentation>();
  for (const entry of fields) {
    byPath.set(entry.path, entry);
  }
  return byPath;
}

/**
 * Annotate pre-resolved field tree nodes with overlay applicability.
 * Does not mutate the input nodes or invent field descriptions/types.
 */
export function annotateSchemaFieldTreeWithVariant(
  nodes: readonly SchemaFieldTreeNode[],
  applicabilityByPath: ReadonlyMap<string, SchemaVariantFieldPresentation>,
): SchemaFieldTreeNode[] {
  return nodes.map((node) => {
    const presentation = applicabilityByPath.get(node.field.path);
    const children =
      node.children !== undefined
        ? annotateSchemaFieldTreeWithVariant(node.children, applicabilityByPath)
        : undefined;
    if (presentation === undefined && children === undefined) {
      return node;
    }
    return {
      field: node.field,
      children,
      variantApplicability: presentation?.applicability,
      variantHint: presentation?.hint,
    };
  });
}

function statusResolution(
  kind: SchemaUiStatusKind,
  title?: string,
  message?: string,
): SchemaVariantStatusResolution {
  return {
    status: kind,
    title: title ?? SCHEMA_UI_STATUS_DEFAULT_TITLES[kind],
    message:
      message !== undefined && message.trim().length > 0
        ? message
        : SCHEMA_UI_STATUS_DEFAULT_MESSAGES[kind],
  };
}

/**
 * Resolve SchemaVariantReference props into a ready variant view or an
 * explicit status outcome. Never throws; never runs W06 validation.
 */
export function resolveSchemaVariantInput(
  input: ResolveSchemaVariantInput,
): SchemaVariantResolution {
  if (input.status !== undefined && input.status !== "ready") {
    return statusResolution(
      input.status,
      input.statusTitle,
      input.statusMessage,
    );
  }

  if (input.definition === undefined) {
    return statusResolution(
      "empty",
      input.statusTitle ?? EMPTY_BASE_TITLE,
      input.statusMessage ?? EMPTY_BASE_MESSAGE,
    );
  }

  if (input.overlay === undefined || input.overlay === null) {
    return statusResolution(
      "invalid",
      input.statusTitle ?? MISSING_OVERLAY_TITLE,
      input.statusMessage ?? MISSING_OVERLAY_MESSAGE,
    );
  }

  if (!isSchemaVariantOverlayPresentation(input.overlay)) {
    return statusResolution(
      "invalid",
      input.statusTitle ?? MISSING_OVERLAY_TITLE,
      input.statusMessage ?? MISSING_OVERLAY_MESSAGE,
    );
  }

  if (input.overlay.fields.length === 0) {
    return statusResolution(
      "empty",
      input.statusTitle ?? EMPTY_OVERLAY_TITLE,
      input.statusMessage ?? EMPTY_OVERLAY_MESSAGE,
    );
  }

  return {
    status: "ready",
    definition: input.definition,
    overlay: input.overlay,
    applicabilityByPath: indexSchemaVariantFieldApplicability(
      input.overlay.fields,
    ),
  };
}
