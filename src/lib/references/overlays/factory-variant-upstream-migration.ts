/**
 * Optional upstreamDefinition migration preference (W06).
 *
 * When an overlay declares `upstreamDefinition` for a later discriminated
 * `$def`, validation and applicability prefer that definition as the
 * authoritative field/discriminator source. Unresolved targets and overlay
 * content that contradicts the resolved upstream fail closed.
 *
 * Pure — no package IO. Callers supply already-projected W04 definition models.
 */

import {
  createSchemaAddress,
  formatSchemaAddress,
  type SchemaAddress,
  type SchemaDefinitionModel,
  type SchemaFieldModel,
} from "../schema-model";
import {
  type FactoryVariantApplicableField,
  indexSchemaDefinitionFieldsByPath,
  type ResolveFactoryVariantApplicableFieldsOptions,
  resolveFactoryVariantApplicableFields,
} from "./factory-variant-field-semantics";
import {
  createFactoryVariantOverlay,
  type FactoryVariantFieldPath,
  type FactoryVariantOverlayId,
  type FactoryVariantOverlaySchema,
} from "./factory-variant-overlay-schema";

export type FactoryVariantAuthoritativeDefinitionSource = "base" | "upstream";

/**
 * Resolved authoritative definition for field/discriminator checks and
 * applicability when migrating toward upstream discriminated `$defs`.
 */
export type FactoryVariantAuthoritativeDefinition = {
  definition: SchemaDefinitionModel;
  source: FactoryVariantAuthoritativeDefinitionSource;
  address: SchemaAddress;
};

export type FactoryVariantUpstreamMigrationErrorCode =
  | "malformed-input"
  | "missing-base-definition"
  | "missing-upstream-definition"
  | "upstream-contradiction";

export class FactoryVariantUpstreamMigrationError extends Error {
  readonly code: FactoryVariantUpstreamMigrationErrorCode;
  readonly overlayId?: string;
  readonly fieldPath?: string;
  readonly identity?: string;
  readonly contradiction?: string;

  constructor(
    code: FactoryVariantUpstreamMigrationErrorCode,
    message: string,
    options: {
      overlayId?: string;
      fieldPath?: string;
      identity?: string;
      contradiction?: string;
      cause?: unknown;
    } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "FactoryVariantUpstreamMigrationError";
    this.code = code;
    this.overlayId = options.overlayId;
    this.fieldPath = options.fieldPath;
    this.identity = options.identity;
    this.contradiction = options.contradiction;
  }
}

function schemaAddressKey(address: SchemaAddress): string {
  return formatSchemaAddress(createSchemaAddress(address));
}

function lookupDefinition(
  definitions: ReadonlyMap<string, SchemaDefinitionModel>,
  address: SchemaAddress,
): SchemaDefinitionModel | undefined {
  return definitions.get(schemaAddressKey(address));
}

/**
 * Resolve allowed discriminator values for a field: inline `enum`, else
 * `refTarget` definition enum.
 */
function resolveDiscriminatorEnumValues(
  field: SchemaFieldModel,
  definitions: ReadonlyMap<string, SchemaDefinitionModel>,
): unknown[] | undefined {
  if (Array.isArray(field.enum) && field.enum.length > 0) {
    return field.enum;
  }

  if (field.refTarget !== undefined) {
    const target = lookupDefinition(definitions, field.refTarget);
    if (target !== undefined && Array.isArray(target.enum)) {
      return target.enum;
    }
  }

  return undefined;
}

function collectOverlayFieldPaths(
  overlay: FactoryVariantOverlaySchema,
): Array<{ path: FactoryVariantFieldPath; slot: string }> {
  const entries: Array<{ path: FactoryVariantFieldPath; slot: string }> = [];

  for (const path of overlay.fields.shared) {
    entries.push({ path, slot: "fields.shared" });
  }
  for (const path of overlay.fields.selected) {
    entries.push({ path, slot: "fields.selected" });
  }
  for (const path of overlay.fields.excluded) {
    entries.push({ path, slot: "fields.excluded" });
  }
  for (const [index, entry] of overlay.fields.conditional.entries()) {
    entries.push({
      path: entry.path,
      slot: `fields.conditional[${index}]`,
    });
  }

  return entries;
}

/**
 * Resolve the authoritative schema definition for an overlay.
 *
 * - No `upstreamDefinition` → prefer the broad `baseDefinition`.
 * - Declared + resolved `upstreamDefinition` → prefer upstream.
 * - Declared but unresolved → fail closed (`missing-upstream-definition`).
 * - Missing base → fail closed (`missing-base-definition`).
 */
export function resolveFactoryVariantAuthoritativeDefinition(
  overlayInput: FactoryVariantOverlaySchema,
  definitions: ReadonlyMap<string, SchemaDefinitionModel>,
): FactoryVariantAuthoritativeDefinition {
  if (definitions === undefined || typeof definitions.get !== "function") {
    throw new FactoryVariantUpstreamMigrationError(
      "malformed-input",
      "Cannot resolve authoritative definition: definitions map is required.",
      { identity: "definitions" },
    );
  }

  const overlay = createFactoryVariantOverlay(overlayInput);
  const overlayId: FactoryVariantOverlayId = overlay.id;

  const base = lookupDefinition(definitions, overlay.baseDefinition);
  if (base === undefined) {
    const identity = schemaAddressKey(overlay.baseDefinition);
    throw new FactoryVariantUpstreamMigrationError(
      "missing-base-definition",
      `Overlay "${overlayId}" base definition "${identity}" does not resolve to a known SchemaDefinitionModel.`,
      { overlayId, identity },
    );
  }

  if (overlay.upstreamDefinition === undefined) {
    return {
      definition: base,
      source: "base",
      address: createSchemaAddress(overlay.baseDefinition),
    };
  }

  const upstream = lookupDefinition(definitions, overlay.upstreamDefinition);
  if (upstream === undefined) {
    const identity = schemaAddressKey(overlay.upstreamDefinition);
    throw new FactoryVariantUpstreamMigrationError(
      "missing-upstream-definition",
      `Overlay "${overlayId}" upstreamDefinition "${identity}" does not resolve to a known SchemaDefinitionModel; migration fails closed and does not fall back to the broad base.`,
      { overlayId, identity },
    );
  }

  return {
    definition: upstream,
    source: "upstream",
    address: createSchemaAddress(overlay.upstreamDefinition),
  };
}

/**
 * When upstream is authoritative, assert overlay discriminator and field slots
 * do not contradict that definition. No-op when authoritative source is base
 * (caller continues with ordinary base validation).
 */
export function assertFactoryVariantUpstreamConsistency(
  overlayInput: FactoryVariantOverlaySchema,
  definitions: ReadonlyMap<string, SchemaDefinitionModel>,
  authoritative: FactoryVariantAuthoritativeDefinition,
): void {
  if (authoritative.source !== "upstream") {
    return;
  }

  const overlay = createFactoryVariantOverlay(overlayInput);
  const overlayId: FactoryVariantOverlayId = overlay.id;
  const upstreamKey = schemaAddressKey(authoritative.address);
  const fieldsByPath = indexSchemaDefinitionFieldsByPath(
    authoritative.definition,
  );

  const discriminatorField = fieldsByPath.get(overlay.discriminator.field);
  if (discriminatorField === undefined) {
    throw new FactoryVariantUpstreamMigrationError(
      "upstream-contradiction",
      `Overlay "${overlayId}" discriminator field "${overlay.discriminator.field}" contradicts upstream definition "${upstreamKey}" (field absent).`,
      {
        overlayId,
        fieldPath: overlay.discriminator.field,
        identity: overlay.discriminator.field,
        contradiction: "discriminator-field",
      },
    );
  }

  const enumValues = resolveDiscriminatorEnumValues(
    discriminatorField,
    definitions,
  );
  if (enumValues === undefined) {
    throw new FactoryVariantUpstreamMigrationError(
      "upstream-contradiction",
      `Overlay "${overlayId}" discriminator field "${overlay.discriminator.field}" contradicts upstream definition "${upstreamKey}" (no resolvable enum values for value "${overlay.discriminator.value}").`,
      {
        overlayId,
        fieldPath: overlay.discriminator.field,
        identity: overlay.discriminator.value,
        contradiction: "discriminator-enum",
      },
    );
  }

  if (!enumValues.includes(overlay.discriminator.value)) {
    throw new FactoryVariantUpstreamMigrationError(
      "upstream-contradiction",
      `Overlay "${overlayId}" discriminator value "${overlay.discriminator.value}" contradicts upstream definition "${upstreamKey}" (value not in published enum for field "${overlay.discriminator.field}").`,
      {
        overlayId,
        fieldPath: overlay.discriminator.field,
        identity: overlay.discriminator.value,
        contradiction: "discriminator-value",
      },
    );
  }

  for (const entry of collectOverlayFieldPaths(overlay)) {
    if (!fieldsByPath.has(entry.path)) {
      throw new FactoryVariantUpstreamMigrationError(
        "upstream-contradiction",
        `Overlay "${overlayId}" ${entry.slot} field path "${entry.path}" contradicts upstream definition "${upstreamKey}" (path absent).`,
        {
          overlayId,
          fieldPath: entry.path,
          identity: entry.path,
          contradiction: entry.slot,
        },
      );
    }
  }
}

/**
 * Resolve applicable fields preferring `upstreamDefinition` when present and
 * resolved. Falls back to the broad base when upstream is absent.
 */
export function resolveFactoryVariantApplicableFieldsPreferringUpstream(
  overlayInput: FactoryVariantOverlaySchema,
  definitions: ReadonlyMap<string, SchemaDefinitionModel>,
  options: ResolveFactoryVariantApplicableFieldsOptions = {},
): {
  fields: FactoryVariantApplicableField[];
  authoritative: FactoryVariantAuthoritativeDefinition;
} {
  const overlay = createFactoryVariantOverlay(overlayInput);
  const authoritative = resolveFactoryVariantAuthoritativeDefinition(
    overlay,
    definitions,
  );

  if (authoritative.source === "upstream") {
    assertFactoryVariantUpstreamConsistency(
      overlay,
      definitions,
      authoritative,
    );
  }

  return {
    fields: resolveFactoryVariantApplicableFields(
      overlay,
      authoritative.definition,
      options,
    ),
    authoritative,
  };
}
