/**
 * Worker/Workstation variant overlay field-applicability semantics (W06).
 *
 * Pure resolution against a W04 `SchemaDefinitionModel` / `SchemaFieldModel`
 * base — no package IO, no UI. Overlays declare applicability only; this module
 * yields the applicable field set without inventing fields absent from the base
 * and without copying canonical field prose into the overlay contract.
 */

import type { SchemaDefinitionModel, SchemaFieldModel } from "../schema-model";
import type {
  FactoryVariantFieldApplicability,
  FactoryVariantFieldPath,
  FactoryVariantOverlaySchema,
} from "./factory-variant-overlay-schema";

/**
 * Typed applicability kinds later validators and embeds can consume.
 * Meanings are machine-stable — not free-form reader prose.
 */
export const FACTORY_VARIANT_FIELD_APPLICABILITY_KINDS = [
  "shared",
  "selected",
  "excluded",
  "conditional",
] as const;

export type FactoryVariantFieldApplicabilityKind =
  (typeof FACTORY_VARIANT_FIELD_APPLICABILITY_KINDS)[number];

/**
 * Stable semantic definitions for each applicability slot.
 * Consumers should branch on `kind`, not on these description strings.
 */
export const FACTORY_VARIANT_FIELD_APPLICABILITY_MEANINGS = {
  shared:
    "Field is always applicable for this variant and is drawn from the broad base definition.",
  selected:
    "Field is explicitly selected as applicable for this variant beyond the shared set.",
  excluded:
    "Field exists on the broad base definition but is omitted from this variant's applicable set.",
  conditional:
    "Field is applicable only when an explicit condition identity holds (companion or discriminator gate).",
} as const satisfies Record<FactoryVariantFieldApplicabilityKind, string>;

/** Kinds that can appear in a resolved applicable set (excluded never appears). */
export type FactoryVariantResolvedFieldKind =
  | "shared"
  | "selected"
  | "conditional";

/**
 * One applicable field resolved against the base definition.
 * `field` is the W04 model from the base — never overlay-authored prose.
 */
export type FactoryVariantApplicableField = {
  path: FactoryVariantFieldPath;
  kind: FactoryVariantResolvedFieldKind;
  /** Present when `kind` is `conditional`. */
  conditionId?: string;
  /** Base definition field model for this path. */
  field: SchemaFieldModel;
};

export type FactoryVariantFieldSemanticsErrorCode =
  | "malformed-input"
  | "unknown-base-field"
  | "conflicting-applicability";

export class FactoryVariantFieldSemanticsError extends Error {
  readonly code: FactoryVariantFieldSemanticsErrorCode;
  readonly overlayId?: string;
  readonly fieldPath?: string;

  constructor(
    code: FactoryVariantFieldSemanticsErrorCode,
    message: string,
    options: {
      overlayId?: string;
      fieldPath?: string;
      cause?: unknown;
    } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "FactoryVariantFieldSemanticsError";
    this.code = code;
    this.overlayId = options.overlayId;
    this.fieldPath = options.fieldPath;
  }
}

export type ResolveFactoryVariantApplicableFieldsOptions = {
  /**
   * Condition identities that currently hold (companion / discriminator gates).
   * Conditional fields are included only when their `conditionId` is active.
   * When omitted, no conditional fields are applicable (fail-closed default).
   */
  activeConditionIds?: ReadonlySet<string> | readonly string[];
  /**
   * When true (default), overlay paths that are not on the base definition
   * fail closed. When false, unknown paths are omitted from the applicable set
   * without inventing field models (still never fabricated).
   */
  failOnUnknownBaseFields?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toConditionSet(
  value: ResolveFactoryVariantApplicableFieldsOptions["activeConditionIds"],
): ReadonlySet<string> {
  if (value === undefined) {
    return new Set();
  }
  if (value instanceof Set) {
    return value;
  }
  return new Set(value);
}

/**
 * Index base definition fields by path. Prefers `properties` keys, then each
 * field's published `path` when it differs from the map key.
 */
export function indexSchemaDefinitionFieldsByPath(
  baseDefinition: SchemaDefinitionModel,
): Map<FactoryVariantFieldPath, SchemaFieldModel> {
  if (!isPlainObject(baseDefinition)) {
    throw new FactoryVariantFieldSemanticsError(
      "malformed-input",
      "Cannot index schema definition fields: base definition must be a plain object.",
      { fieldPath: "baseDefinition" },
    );
  }

  const byPath = new Map<FactoryVariantFieldPath, SchemaFieldModel>();
  const properties = baseDefinition.properties;
  if (properties === undefined) {
    return byPath;
  }

  for (const [key, field] of Object.entries(properties)) {
    byPath.set(key, field);
    if (typeof field.path === "string" && field.path.length > 0) {
      byPath.set(field.path, field);
    }
  }

  return byPath;
}

function requireFieldApplicability(
  fields: FactoryVariantFieldApplicability,
  overlayId?: string,
): FactoryVariantFieldApplicability {
  if (!isPlainObject(fields)) {
    throw new FactoryVariantFieldSemanticsError(
      "malformed-input",
      "Cannot resolve overlay fields: applicability slots must be a plain object.",
      { overlayId, fieldPath: "fields" },
    );
  }
  return fields;
}

function lookupBaseField(
  byPath: Map<FactoryVariantFieldPath, SchemaFieldModel>,
  path: FactoryVariantFieldPath,
  options: {
    overlayId?: string;
    failOnUnknown: boolean;
  },
): SchemaFieldModel | undefined {
  const field = byPath.get(path);
  if (field !== undefined) {
    return field;
  }

  if (options.failOnUnknown) {
    throw new FactoryVariantFieldSemanticsError(
      "unknown-base-field",
      `Overlay${options.overlayId !== undefined ? ` "${options.overlayId}"` : ""} references field path "${path}" that is absent from the base SchemaDefinitionModel. Applicable sets must not invent fields.`,
      { overlayId: options.overlayId, fieldPath: path },
    );
  }

  return undefined;
}

type PendingKind = FactoryVariantResolvedFieldKind;

/**
 * Resolve the applicable field set for an overlay against a W04 base definition.
 *
 * Rules:
 * - `shared` and `selected` contribute when the path exists on the base.
 * - `conditional` contributes only when its `conditionId` is in
 *   `activeConditionIds`.
 * - `excluded` omits the path from the applicable set even when present on the
 *   broad base (and wins over shared/selected/conditional).
 * - Paths absent from the base are never invented as field models.
 */
function isFactoryVariantOverlaySchema(
  value: unknown,
): value is FactoryVariantOverlaySchema {
  return (
    isPlainObject(value) && "fields" in value && typeof value.id === "string"
  );
}

export function resolveFactoryVariantApplicableFields(
  overlayOrFields:
    | FactoryVariantOverlaySchema
    | FactoryVariantFieldApplicability,
  baseDefinition: SchemaDefinitionModel,
  options: ResolveFactoryVariantApplicableFieldsOptions = {},
): FactoryVariantApplicableField[] {
  const overlayId = isFactoryVariantOverlaySchema(overlayOrFields)
    ? overlayOrFields.id
    : undefined;

  const fields = requireFieldApplicability(
    isFactoryVariantOverlaySchema(overlayOrFields)
      ? overlayOrFields.fields
      : overlayOrFields,
    overlayId,
  );

  const byPath = indexSchemaDefinitionFieldsByPath(baseDefinition);
  const activeConditions = toConditionSet(options.activeConditionIds);
  const failOnUnknown = options.failOnUnknownBaseFields !== false;

  const excluded = new Set(fields.excluded);
  for (const path of excluded) {
    // Exclusions must still name real base fields when fail-closed is on.
    lookupBaseField(byPath, path, { overlayId, failOnUnknown });
  }

  /** path → pending applicability (excluded paths never enter this map). */
  const pending = new Map<
    FactoryVariantFieldPath,
    {
      kind: PendingKind;
      conditionId?: string;
      field: SchemaFieldModel;
    }
  >();

  const assign = (
    path: FactoryVariantFieldPath,
    kind: PendingKind,
    conditionId?: string,
  ): void => {
    if (excluded.has(path)) {
      return;
    }

    const field = lookupBaseField(byPath, path, { overlayId, failOnUnknown });
    if (field === undefined) {
      return;
    }

    const existing = pending.get(path);
    if (existing === undefined) {
      pending.set(
        path,
        conditionId !== undefined
          ? { kind, conditionId, field }
          : { kind, field },
      );
      return;
    }

    // Prefer selected over shared; conditional stays conditional when both
    // declare the same path with matching condition identity.
    if (existing.kind === kind) {
      if (
        kind === "conditional" &&
        existing.conditionId !== undefined &&
        conditionId !== undefined &&
        existing.conditionId !== conditionId
      ) {
        throw new FactoryVariantFieldSemanticsError(
          "conflicting-applicability",
          `Overlay${overlayId !== undefined ? ` "${overlayId}"` : ""} field path "${path}" has conflicting conditional conditionIds "${existing.conditionId}" and "${conditionId}".`,
          { overlayId, fieldPath: path },
        );
      }
      return;
    }

    if (existing.kind === "shared" && kind === "selected") {
      pending.set(path, { kind: "selected", field });
      return;
    }
    if (existing.kind === "selected" && kind === "shared") {
      return;
    }

    throw new FactoryVariantFieldSemanticsError(
      "conflicting-applicability",
      `Overlay${overlayId !== undefined ? ` "${overlayId}"` : ""} field path "${path}" has conflicting applicability kinds "${existing.kind}" and "${kind}".`,
      { overlayId, fieldPath: path },
    );
  };

  for (const path of fields.shared) {
    assign(path, "shared");
  }
  for (const path of fields.selected) {
    assign(path, "selected");
  }
  for (const entry of fields.conditional) {
    if (!activeConditions.has(entry.conditionId)) {
      continue;
    }
    assign(entry.path, "conditional", entry.conditionId);
  }

  return [...pending.entries()].map(([path, entry]) => {
    const result: FactoryVariantApplicableField = {
      path,
      kind: entry.kind,
      field: entry.field,
    };
    if (entry.conditionId !== undefined) {
      result.conditionId = entry.conditionId;
    }
    return result;
  });
}

/**
 * Convenience: applicable field paths only (stable string identities).
 */
export function resolveFactoryVariantApplicableFieldPaths(
  overlayOrFields:
    | FactoryVariantOverlaySchema
    | FactoryVariantFieldApplicability,
  baseDefinition: SchemaDefinitionModel,
  options: ResolveFactoryVariantApplicableFieldsOptions = {},
): FactoryVariantFieldPath[] {
  return resolveFactoryVariantApplicableFields(
    overlayOrFields,
    baseDefinition,
    options,
  ).map((entry) => entry.path);
}
