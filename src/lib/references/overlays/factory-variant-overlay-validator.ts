/**
 * Factory Worker/Workstation variant overlay validator (W06).
 *
 * Validates overlay field paths and discriminators against installed package
 * schemas projected through W04 `SchemaDefinitionModel` / `SchemaFieldModel`.
 * Callers acquire package artifacts via W03 public-subpath resolution and pass
 * projected models into this pure validator — no filesystem IO here.
 *
 * Authored example references are existence-checked against an explicit catalog
 * only; example content authorship stays out of W06 page work.
 *
 * Optional `upstreamDefinition` migration preference is owned by a later story;
 * this validator checks the overlay's `baseDefinition` (+ field slots /
 * discriminator / examples) as declared. Pass `fieldAttribution` on the
 * validation context to enable incompatible companion field-selection checks.
 */

import {
  createSchemaAddress,
  createSchemaDefinitionModel,
  createSchemaFieldModel,
  formatSchemaAddress,
  type SchemaAddress,
  type SchemaDefinitionModel,
  type SchemaFieldModel,
} from "../schema-model";
import { indexSchemaDefinitionFieldsByPath } from "./factory-variant-field-semantics";
import {
  type FactoryVariantFieldAttribution,
  FactoryVariantIncompatibleFieldSelectionError,
  validateFactoryVariantIncompatibleFieldSelection,
} from "./factory-variant-incompatible-field-selection";
import {
  FACTORY_SCHEMAS_ARTIFACT_ID,
  FACTORY_VARIANT_BASE_DEFINITION_POINTER,
  FACTORY_VARIANT_ENUM_DEFINITION_POINTER,
} from "./factory-variant-overlay-registry";
import {
  createFactoryVariantOverlay,
  type FactoryVariantFieldPath,
  type FactoryVariantOverlayId,
  type FactoryVariantOverlaySchema,
} from "./factory-variant-overlay-schema";

export type FactoryVariantOverlayValidationErrorCode =
  | "malformed-input"
  | "missing-base-definition"
  | "unknown-discriminator-field"
  | "unknown-discriminator-value"
  | "unknown-field-path"
  | "missing-example-ref"
  | "incompatible-field-selection";

export class FactoryVariantOverlayValidationError extends Error {
  readonly code: FactoryVariantOverlayValidationErrorCode;
  readonly overlayId?: string;
  readonly fieldPath?: string;
  readonly exampleId?: string;
  readonly identity?: string;
  readonly conflictingVariantId?: string;

  constructor(
    code: FactoryVariantOverlayValidationErrorCode,
    message: string,
    options: {
      overlayId?: string;
      fieldPath?: string;
      exampleId?: string;
      identity?: string;
      conflictingVariantId?: string;
      cause?: unknown;
    } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "FactoryVariantOverlayValidationError";
    this.code = code;
    this.overlayId = options.overlayId;
    this.fieldPath = options.fieldPath;
    this.exampleId = options.exampleId;
    this.identity = options.identity;
    this.conflictingVariantId = options.conflictingVariantId;
  }
}

/**
 * Validation context: W04 definition catalog + authored example identities.
 * Definitions must already be projected from package schemas (or fixtures).
 */
export type FactoryVariantOverlayValidationContext = {
  /**
   * Known schema definitions keyed by `formatSchemaAddress(address)`.
   * Must include every overlay `baseDefinition` and any discriminator enum
   * targets referenced via field `refTarget`.
   */
  definitions: ReadonlyMap<string, SchemaDefinitionModel>;
  /**
   * Authored example identities known to exist. Overlay `examples[].exampleId`
   * values absent from this set fail closed.
   */
  knownExampleIds: ReadonlySet<string>;
  /**
   * Optional field attribution from overlay `selected` slots. When present,
   * selected fields attributed only to incompatible companions fail closed.
   */
  fieldAttribution?: FactoryVariantFieldAttribution;
};

export type FactoryVariantOverlayValidationContextInput = {
  definitions: Iterable<SchemaDefinitionModel>;
  knownExampleIds?: Iterable<string>;
  fieldAttribution?: FactoryVariantFieldAttribution;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function schemaAddressKey(address: SchemaAddress): string {
  return formatSchemaAddress(createSchemaAddress(address));
}

/**
 * Build a validation context from already-projected W04 definition models.
 */
export function createFactoryVariantOverlayValidationContext(
  input: FactoryVariantOverlayValidationContextInput,
): FactoryVariantOverlayValidationContext {
  if (!isPlainObject(input) || input.definitions === undefined) {
    throw new FactoryVariantOverlayValidationError(
      "malformed-input",
      "Cannot create overlay validation context: definitions iterable is required.",
      { identity: "definitions" },
    );
  }

  const definitions = new Map<string, SchemaDefinitionModel>();
  for (const definition of input.definitions) {
    if (
      !isPlainObject(definition) ||
      !isPlainObject(definition.address) ||
      typeof definition.address.publicArtifactId !== "string" ||
      typeof definition.address.pointer !== "string"
    ) {
      throw new FactoryVariantOverlayValidationError(
        "malformed-input",
        "Cannot create overlay validation context: each definition must carry a SchemaAddress.",
        { identity: "definition.address" },
      );
    }
    const address = createSchemaAddress(definition.address);
    definitions.set(schemaAddressKey(address), definition);
  }

  const knownExampleIds = new Set<string>();
  if (input.knownExampleIds !== undefined) {
    for (const exampleId of input.knownExampleIds) {
      if (typeof exampleId !== "string" || exampleId.length === 0) {
        throw new FactoryVariantOverlayValidationError(
          "malformed-input",
          "Cannot create overlay validation context: knownExampleIds must be non-empty strings.",
          { identity: "knownExampleIds" },
        );
      }
      knownExampleIds.add(exampleId);
    }
  }

  return {
    definitions,
    knownExampleIds,
    ...(input.fieldAttribution !== undefined
      ? { fieldAttribution: input.fieldAttribution }
      : {}),
  };
}

function lookupDefinition(
  context: FactoryVariantOverlayValidationContext,
  address: SchemaAddress,
): SchemaDefinitionModel | undefined {
  return context.definitions.get(schemaAddressKey(address));
}

/**
 * Resolve allowed discriminator values for a field: inline `enum`, else
 * `refTarget` definition enum. Returns undefined when neither publishes values.
 */
function resolveDiscriminatorEnumValues(
  field: SchemaFieldModel,
  context: FactoryVariantOverlayValidationContext,
): unknown[] | undefined {
  if (Array.isArray(field.enum) && field.enum.length > 0) {
    return field.enum;
  }

  if (field.refTarget !== undefined) {
    const target = lookupDefinition(context, field.refTarget);
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
 * Validate one overlay against installed schema models + example catalog.
 * Fails closed with diagnostics that name the overlay and offending identity.
 */
export function validateFactoryVariantOverlay(
  overlayInput: FactoryVariantOverlaySchema,
  context: FactoryVariantOverlayValidationContext,
): void {
  const overlay = createFactoryVariantOverlay(overlayInput);
  const overlayId: FactoryVariantOverlayId = overlay.id;

  const base = lookupDefinition(context, overlay.baseDefinition);
  if (base === undefined) {
    const identity = schemaAddressKey(overlay.baseDefinition);
    throw new FactoryVariantOverlayValidationError(
      "missing-base-definition",
      `Overlay "${overlayId}" base definition "${identity}" does not resolve to a known SchemaDefinitionModel.`,
      { overlayId, identity },
    );
  }

  const fieldsByPath = indexSchemaDefinitionFieldsByPath(base);
  const discriminatorField = fieldsByPath.get(overlay.discriminator.field);
  if (discriminatorField === undefined) {
    throw new FactoryVariantOverlayValidationError(
      "unknown-discriminator-field",
      `Overlay "${overlayId}" discriminator field "${overlay.discriminator.field}" is absent from base definition "${schemaAddressKey(overlay.baseDefinition)}".`,
      {
        overlayId,
        fieldPath: overlay.discriminator.field,
        identity: overlay.discriminator.field,
      },
    );
  }

  const enumValues = resolveDiscriminatorEnumValues(
    discriminatorField,
    context,
  );
  if (enumValues === undefined) {
    throw new FactoryVariantOverlayValidationError(
      "unknown-discriminator-value",
      `Overlay "${overlayId}" discriminator field "${overlay.discriminator.field}" has no resolvable enum values on the base definition or refTarget; cannot prove value "${overlay.discriminator.value}".`,
      {
        overlayId,
        fieldPath: overlay.discriminator.field,
        identity: overlay.discriminator.value,
      },
    );
  }

  if (!enumValues.includes(overlay.discriminator.value)) {
    throw new FactoryVariantOverlayValidationError(
      "unknown-discriminator-value",
      `Overlay "${overlayId}" discriminator value "${overlay.discriminator.value}" is not in the published enum for field "${overlay.discriminator.field}".`,
      {
        overlayId,
        fieldPath: overlay.discriminator.field,
        identity: overlay.discriminator.value,
      },
    );
  }

  for (const entry of collectOverlayFieldPaths(overlay)) {
    if (!fieldsByPath.has(entry.path)) {
      throw new FactoryVariantOverlayValidationError(
        "unknown-field-path",
        `Overlay "${overlayId}" ${entry.slot} references field path "${entry.path}" that is absent from base definition "${schemaAddressKey(overlay.baseDefinition)}".`,
        {
          overlayId,
          fieldPath: entry.path,
          identity: entry.path,
        },
      );
    }
  }

  for (const example of overlay.examples) {
    if (!context.knownExampleIds.has(example.exampleId)) {
      throw new FactoryVariantOverlayValidationError(
        "missing-example-ref",
        `Overlay "${overlayId}" authored example reference "${example.exampleId}" is missing from the known example catalog.`,
        {
          overlayId,
          exampleId: example.exampleId,
          identity: example.exampleId,
        },
      );
    }
  }

  if (context.fieldAttribution !== undefined) {
    try {
      validateFactoryVariantIncompatibleFieldSelection(
        overlay,
        context.fieldAttribution,
      );
    } catch (cause) {
      if (cause instanceof FactoryVariantIncompatibleFieldSelectionError) {
        throw new FactoryVariantOverlayValidationError(
          "incompatible-field-selection",
          cause.message,
          {
            overlayId: cause.overlayId ?? overlayId,
            fieldPath: cause.fieldPath,
            identity: cause.fieldPath,
            conflictingVariantId: cause.conflictingVariantId,
            cause,
          },
        );
      }
      throw cause;
    }
  }
}

/**
 * Validate every overlay; stops at the first failure (fail closed).
 */
export function validateFactoryVariantOverlays(
  overlays: Iterable<FactoryVariantOverlaySchema>,
  context: FactoryVariantOverlayValidationContext,
): void {
  for (const overlay of overlays) {
    validateFactoryVariantOverlay(overlay, context);
  }
}

/** Local `$ref` forms accepted when projecting Factory schema properties. */
function parseLocalDefRef(
  ref: string,
  publicArtifactId: string,
): SchemaAddress | undefined {
  const trimmed = ref.trim();
  const match = trimmed.match(/^#\/\$defs\/([^/]+)$/);
  if (match === null || match[1] === undefined || match[1].length === 0) {
    return undefined;
  }
  return createSchemaAddress({
    publicArtifactId,
    pointer: `/$defs/${match[1]}`,
  });
}

/**
 * Extract a single local `$defs` ref from a property schema node
 * (`$ref` or `allOf: [{ $ref }]`).
 */
function extractLocalRefTarget(
  propertySchema: Record<string, unknown>,
  publicArtifactId: string,
): SchemaAddress | undefined {
  if (typeof propertySchema.$ref === "string") {
    return parseLocalDefRef(propertySchema.$ref, publicArtifactId);
  }

  if (Array.isArray(propertySchema.allOf) && propertySchema.allOf.length > 0) {
    for (const entry of propertySchema.allOf) {
      if (
        isPlainObject(entry) &&
        typeof entry.$ref === "string" &&
        Object.keys(entry).length === 1
      ) {
        const target = parseLocalDefRef(entry.$ref, publicArtifactId);
        if (target !== undefined) {
          return target;
        }
      }
    }
  }

  return undefined;
}

function projectObjectDefinitionFromRaw(
  raw: Record<string, unknown>,
  publicArtifactId: string,
  pointer: string,
): SchemaDefinitionModel {
  const requiredNames = new Set<string>();
  if (Array.isArray(raw.required)) {
    for (const name of raw.required) {
      if (typeof name === "string" && name.length > 0) {
        requiredNames.add(name);
      }
    }
  }

  const properties: Record<string, SchemaFieldModel> = {};
  if (isPlainObject(raw.properties)) {
    for (const [propName, propRaw] of Object.entries(raw.properties)) {
      if (!isPlainObject(propRaw)) {
        continue;
      }

      const field: SchemaFieldModel = {
        path: propName,
        required: requiredNames.has(propName),
      };

      const refTarget = extractLocalRefTarget(propRaw, publicArtifactId);
      if (refTarget !== undefined) {
        field.refTarget = refTarget;
      }

      if (Array.isArray(propRaw.enum)) {
        field.enum = propRaw.enum;
      }

      properties[propName] = createSchemaFieldModel(field);
    }
  }

  return createSchemaDefinitionModel({
    address: createSchemaAddress({ publicArtifactId, pointer }),
    type: "object",
    properties,
    required: [...requiredNames],
  });
}

function projectEnumDefinitionFromRaw(
  defName: string,
  raw: Record<string, unknown>,
  publicArtifactId: string,
  pointer: string,
): SchemaDefinitionModel {
  if (!Array.isArray(raw.enum)) {
    throw new FactoryVariantOverlayValidationError(
      "malformed-input",
      `Factory schema $defs.${defName} is missing an enum array.`,
      { identity: `$defs.${defName}.enum` },
    );
  }

  return createSchemaDefinitionModel({
    address: createSchemaAddress({ publicArtifactId, pointer }),
    type: "string",
    enum: raw.enum,
  });
}

/**
 * Project W03-resolved Factory schema data into W04 definition models needed
 * for overlay field / discriminator validation (Worker, Workstation, and the
 * three variant enum `$defs`).
 */
export function factoryVariantOverlayDefinitionsFromFactorySchemaData(
  data: unknown,
  publicArtifactId: string = FACTORY_SCHEMAS_ARTIFACT_ID,
): SchemaDefinitionModel[] {
  if (!isPlainObject(data)) {
    throw new FactoryVariantOverlayValidationError(
      "malformed-input",
      "Factory schema data must be a plain object to project overlay validation definitions.",
      { identity: "data" },
    );
  }

  const defs = data.$defs;
  if (!isPlainObject(defs)) {
    throw new FactoryVariantOverlayValidationError(
      "malformed-input",
      "Factory schema data is missing a plain-object $defs map.",
      { identity: "$defs" },
    );
  }

  const requireDefObject = (name: string): Record<string, unknown> => {
    const raw = defs[name];
    if (!isPlainObject(raw)) {
      throw new FactoryVariantOverlayValidationError(
        "malformed-input",
        `Factory schema $defs.${name} must be an object.`,
        { identity: `$defs.${name}` },
      );
    }
    return raw;
  };

  return [
    projectObjectDefinitionFromRaw(
      requireDefObject("Worker"),
      publicArtifactId,
      FACTORY_VARIANT_BASE_DEFINITION_POINTER.worker,
    ),
    projectObjectDefinitionFromRaw(
      requireDefObject("Workstation"),
      publicArtifactId,
      FACTORY_VARIANT_BASE_DEFINITION_POINTER.workstation,
    ),
    projectEnumDefinitionFromRaw(
      "WorkerType",
      requireDefObject("WorkerType"),
      publicArtifactId,
      FACTORY_VARIANT_ENUM_DEFINITION_POINTER.worker,
    ),
    projectEnumDefinitionFromRaw(
      "WorkstationType",
      requireDefObject("WorkstationType"),
      publicArtifactId,
      FACTORY_VARIANT_ENUM_DEFINITION_POINTER.workstation,
    ),
    projectEnumDefinitionFromRaw(
      "WorkstationKind",
      requireDefObject("WorkstationKind"),
      publicArtifactId,
      FACTORY_VARIANT_ENUM_DEFINITION_POINTER.behavior,
    ),
  ];
}

/**
 * Build a validation context from W03-resolved Factory schema data plus an
 * optional authored example catalog.
 */
export function createFactoryVariantOverlayValidationContextFromFactorySchemaData(
  data: unknown,
  options: {
    publicArtifactId?: string;
    knownExampleIds?: Iterable<string>;
  } = {},
): FactoryVariantOverlayValidationContext {
  const definitions = factoryVariantOverlayDefinitionsFromFactorySchemaData(
    data,
    options.publicArtifactId ?? FACTORY_SCHEMAS_ARTIFACT_ID,
  );
  return createFactoryVariantOverlayValidationContext({
    definitions,
    knownExampleIds: options.knownExampleIds,
  });
}
