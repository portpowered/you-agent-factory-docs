/**
 * Factory Worker/Workstation variant overlay registry (W06).
 *
 * Registers one canonical overlay identity for every current Worker type,
 * Workstation type, and Workstation behavior. Completeness is verified against
 * installed Factory schema enums projected through W04 `SchemaDefinitionModel`
 * (callers acquire the package artifact via W03 public-subpath resolution).
 *
 * Pure registry + inventory helpers — no filesystem IO in this module. Package
 * loading stays at the call site (tests / later validators).
 *
 * Mock-worker variants are intentionally excluded: they live in
 * `schemas/mock-workers`, not in Factory `WorkerType`.
 */

import {
  createSchemaAddress,
  createSchemaDefinitionModel,
  type SchemaDefinitionModel,
} from "../schema-model";
import {
  createFactoryVariantOverlay,
  type FactoryVariantOverlayId,
  type FactoryVariantOverlaySchema,
} from "./factory-variant-overlay-schema";

/** Public Factory schema artifact identity used for overlay base addresses. */
export const FACTORY_SCHEMAS_ARTIFACT_ID =
  "@you-agent-factory/api/schemas/factory" as const;

/** Overlay axis prefixes used in stable overlay IDs. */
export const FACTORY_VARIANT_OVERLAY_AXES = [
  "worker",
  "workstation",
  "behavior",
] as const;

export type FactoryVariantOverlayAxis =
  (typeof FACTORY_VARIANT_OVERLAY_AXES)[number];

const AXIS_SET = new Set<string>(FACTORY_VARIANT_OVERLAY_AXES);

/** Discriminator field on the base definition for each overlay axis. */
export const FACTORY_VARIANT_DISCRIMINATOR_FIELD = {
  worker: "type",
  workstation: "type",
  behavior: "behavior",
} as const satisfies Record<FactoryVariantOverlayAxis, string>;

/** Base definition JSON Pointer for each overlay axis. */
export const FACTORY_VARIANT_BASE_DEFINITION_POINTER = {
  worker: "/$defs/Worker",
  workstation: "/$defs/Workstation",
  behavior: "/$defs/Workstation",
} as const satisfies Record<FactoryVariantOverlayAxis, string>;

/** Enum `$defs` pointer that owns published values for each axis. */
export const FACTORY_VARIANT_ENUM_DEFINITION_POINTER = {
  worker: "/$defs/WorkerType",
  workstation: "/$defs/WorkstationType",
  behavior: "/$defs/WorkstationKind",
} as const satisfies Record<FactoryVariantOverlayAxis, string>;

/**
 * Resolved enum inventory for Factory variant overlays.
 * Values come from installed schema enums — not plan prose.
 */
export type FactoryVariantEnumInventory = {
  workerTypes: string[];
  workstationTypes: string[];
  workstationBehaviors: string[];
};

export type FactoryVariantOverlayRegistryErrorCode =
  | "malformed-input"
  | "duplicate-overlay"
  | "unknown-overlay"
  | "missing-overlay"
  | "axis-mismatch"
  | "malformed-inventory";

export class FactoryVariantOverlayRegistryError extends Error {
  readonly code: FactoryVariantOverlayRegistryErrorCode;
  readonly overlayId?: string;
  readonly field?: string;

  constructor(
    code: FactoryVariantOverlayRegistryErrorCode,
    message: string,
    options: { overlayId?: string; field?: string; cause?: unknown } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "FactoryVariantOverlayRegistryError";
    this.code = code;
    this.overlayId = options.overlayId;
    this.field = options.field;
  }
}

export function isFactoryVariantOverlayAxis(
  value: unknown,
): value is FactoryVariantOverlayAxis {
  return typeof value === "string" && AXIS_SET.has(value);
}

/**
 * Build a stable overlay ID (`worker:AGENT_WORKER`, `behavior:STANDARD`, …).
 */
export function buildFactoryVariantOverlayId(
  axis: FactoryVariantOverlayAxis,
  discriminatorValue: string,
): FactoryVariantOverlayId {
  if (!isFactoryVariantOverlayAxis(axis)) {
    throw new FactoryVariantOverlayRegistryError(
      "malformed-input",
      `Cannot build overlay ID: unsupported axis "${String(axis)}".`,
      { field: "axis" },
    );
  }
  if (
    typeof discriminatorValue !== "string" ||
    discriminatorValue.length === 0
  ) {
    throw new FactoryVariantOverlayRegistryError(
      "malformed-input",
      `Cannot build overlay ID: discriminator value must be a non-empty string.`,
      { field: "discriminatorValue" },
    );
  }
  return `${axis}:${discriminatorValue}`;
}

/**
 * Parse `axis:value` overlay IDs. Fails closed on unknown axis prefixes.
 */
export function parseFactoryVariantOverlayId(overlayId: string): {
  axis: FactoryVariantOverlayAxis;
  discriminatorValue: string;
} {
  if (typeof overlayId !== "string" || overlayId.length === 0) {
    throw new FactoryVariantOverlayRegistryError(
      "malformed-input",
      "Cannot parse overlay ID: expected a non-empty string.",
      { field: "overlayId" },
    );
  }

  const separator = overlayId.indexOf(":");
  if (separator <= 0 || separator === overlayId.length - 1) {
    throw new FactoryVariantOverlayRegistryError(
      "malformed-input",
      `Cannot parse overlay ID "${overlayId}": expected "{axis}:{discriminatorValue}".`,
      { overlayId, field: "overlayId" },
    );
  }

  const axis = overlayId.slice(0, separator);
  const discriminatorValue = overlayId.slice(separator + 1);
  if (!isFactoryVariantOverlayAxis(axis)) {
    throw new FactoryVariantOverlayRegistryError(
      "malformed-input",
      `Cannot parse overlay ID "${overlayId}": unsupported axis "${axis}".`,
      { overlayId, field: "axis" },
    );
  }
  if (discriminatorValue.includes(":")) {
    throw new FactoryVariantOverlayRegistryError(
      "malformed-input",
      `Cannot parse overlay ID "${overlayId}": discriminator value must not contain ":".`,
      { overlayId, field: "discriminatorValue" },
    );
  }

  return { axis, discriminatorValue };
}

function emptyFieldApplicability(): FactoryVariantOverlaySchema["fields"] {
  return {
    shared: [],
    selected: [],
    excluded: [],
    conditional: [],
  };
}

/**
 * Build a minimal canonical overlay for one published discriminator value.
 * Field applicability / companions / examples stay empty until later stories.
 */
export function createCanonicalFactoryVariantOverlay(
  axis: FactoryVariantOverlayAxis,
  discriminatorValue: string,
): FactoryVariantOverlaySchema {
  const id = buildFactoryVariantOverlayId(axis, discriminatorValue);
  return createFactoryVariantOverlay({
    id,
    baseDefinition: createSchemaAddress({
      publicArtifactId: FACTORY_SCHEMAS_ARTIFACT_ID,
      pointer: FACTORY_VARIANT_BASE_DEFINITION_POINTER[axis],
    }),
    discriminator: {
      field: FACTORY_VARIANT_DISCRIMINATOR_FIELD[axis],
      value: discriminatorValue,
    },
    fields: emptyFieldApplicability(),
    companions: {
      compatible: [],
      required: [],
    },
    examples: [],
  });
}

function requireStringEnum(
  definition: SchemaDefinitionModel,
  field: string,
): string[] {
  if (!Array.isArray(definition.enum) || definition.enum.length === 0) {
    throw new FactoryVariantOverlayRegistryError(
      "malformed-inventory",
      `Factory variant enum inventory field "${field}" requires a non-empty SchemaDefinitionModel.enum.`,
      { field },
    );
  }

  return definition.enum.map((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0) {
      throw new FactoryVariantOverlayRegistryError(
        "malformed-inventory",
        `Factory variant enum inventory field "${field}[${index}]" must be a non-empty string.`,
        { field: `${field}[${index}]` },
      );
    }
    return entry;
  });
}

/**
 * Project W04 enum definition models into a Factory variant inventory.
 * Prefer this over reading raw package JSON in registry callers.
 */
export function factoryVariantEnumInventoryFromSchemaDefinitions(input: {
  workerType: SchemaDefinitionModel;
  workstationType: SchemaDefinitionModel;
  workstationKind: SchemaDefinitionModel;
}): FactoryVariantEnumInventory {
  return {
    workerTypes: requireStringEnum(input.workerType, "workerType.enum"),
    workstationTypes: requireStringEnum(
      input.workstationType,
      "workstationType.enum",
    ),
    workstationBehaviors: requireStringEnum(
      input.workstationKind,
      "workstationKind.enum",
    ),
  };
}

/**
 * Project a W03-resolved Factory schema document into variant enum inventory
 * via W04 `SchemaDefinitionModel` (enum values only — no copied prose into
 * overlays).
 */
export function factoryVariantEnumInventoryFromFactorySchemaData(
  data: unknown,
  publicArtifactId: string = FACTORY_SCHEMAS_ARTIFACT_ID,
): FactoryVariantEnumInventory {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new FactoryVariantOverlayRegistryError(
      "malformed-inventory",
      "Factory schema data must be a plain object to extract variant enums.",
      { field: "data" },
    );
  }

  const defs = (data as { $defs?: unknown }).$defs;
  if (typeof defs !== "object" || defs === null || Array.isArray(defs)) {
    throw new FactoryVariantOverlayRegistryError(
      "malformed-inventory",
      "Factory schema data is missing a plain-object $defs map.",
      { field: "$defs" },
    );
  }

  const defMap = defs as Record<string, unknown>;

  const toEnumDefinition = (
    defName: string,
    pointer: string,
  ): SchemaDefinitionModel => {
    const raw = defMap[defName];
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      throw new FactoryVariantOverlayRegistryError(
        "malformed-inventory",
        `Factory schema $defs.${defName} must be an object with an enum array.`,
        { field: `$defs.${defName}` },
      );
    }
    const enumValues = (raw as { enum?: unknown }).enum;
    if (!Array.isArray(enumValues)) {
      throw new FactoryVariantOverlayRegistryError(
        "malformed-inventory",
        `Factory schema $defs.${defName} is missing an enum array.`,
        { field: `$defs.${defName}.enum` },
      );
    }

    return createSchemaDefinitionModel({
      address: createSchemaAddress({ publicArtifactId, pointer }),
      type: "string",
      enum: enumValues,
    });
  };

  return factoryVariantEnumInventoryFromSchemaDefinitions({
    workerType: toEnumDefinition(
      "WorkerType",
      FACTORY_VARIANT_ENUM_DEFINITION_POINTER.worker,
    ),
    workstationType: toEnumDefinition(
      "WorkstationType",
      FACTORY_VARIANT_ENUM_DEFINITION_POINTER.workstation,
    ),
    workstationKind: toEnumDefinition(
      "WorkstationKind",
      FACTORY_VARIANT_ENUM_DEFINITION_POINTER.behavior,
    ),
  });
}

/**
 * Expected overlay IDs derived from a Factory variant enum inventory.
 */
export function expectedFactoryVariantOverlayIds(
  inventory: FactoryVariantEnumInventory,
): FactoryVariantOverlayId[] {
  return [
    ...inventory.workerTypes.map((value) =>
      buildFactoryVariantOverlayId("worker", value),
    ),
    ...inventory.workstationTypes.map((value) =>
      buildFactoryVariantOverlayId("workstation", value),
    ),
    ...inventory.workstationBehaviors.map((value) =>
      buildFactoryVariantOverlayId("behavior", value),
    ),
  ];
}

/**
 * Build-time overlay registry keyed by stable overlay ID.
 * Fails closed on duplicate registration and completeness mismatches.
 */
export class FactoryVariantOverlayRegistry {
  private readonly byId = new Map<
    FactoryVariantOverlayId,
    FactoryVariantOverlaySchema
  >();

  /** Register (or fail on conflicting re-registration) one overlay. */
  register(overlay: FactoryVariantOverlaySchema): void {
    const parsed = createFactoryVariantOverlay(overlay);
    const { axis, discriminatorValue } = parseFactoryVariantOverlayId(
      parsed.id,
    );

    if (parsed.discriminator.value !== discriminatorValue) {
      throw new FactoryVariantOverlayRegistryError(
        "axis-mismatch",
        `Overlay "${parsed.id}" discriminator value "${parsed.discriminator.value}" does not match overlay ID value "${discriminatorValue}".`,
        { overlayId: parsed.id, field: "discriminator.value" },
      );
    }

    const expectedField = FACTORY_VARIANT_DISCRIMINATOR_FIELD[axis];
    if (parsed.discriminator.field !== expectedField) {
      throw new FactoryVariantOverlayRegistryError(
        "axis-mismatch",
        `Overlay "${parsed.id}" discriminator field "${parsed.discriminator.field}" must be "${expectedField}" for axis "${axis}".`,
        { overlayId: parsed.id, field: "discriminator.field" },
      );
    }

    const existing = this.byId.get(parsed.id);
    if (existing !== undefined) {
      if (JSON.stringify(existing) !== JSON.stringify(parsed)) {
        throw new FactoryVariantOverlayRegistryError(
          "duplicate-overlay",
          `Overlay "${parsed.id}" is already registered with a different payload.`,
          { overlayId: parsed.id },
        );
      }
      return;
    }

    this.byId.set(parsed.id, parsed);
  }

  get(overlayId: FactoryVariantOverlayId): FactoryVariantOverlaySchema {
    const overlay = this.byId.get(overlayId);
    if (overlay === undefined) {
      throw new FactoryVariantOverlayRegistryError(
        "unknown-overlay",
        `Unknown Factory variant overlay "${overlayId}".`,
        { overlayId },
      );
    }
    return overlay;
  }

  has(overlayId: FactoryVariantOverlayId): boolean {
    return this.byId.has(overlayId);
  }

  /** Snapshot of registered overlays in insertion order. */
  list(): FactoryVariantOverlaySchema[] {
    return [...this.byId.values()];
  }

  listIds(): FactoryVariantOverlayId[] {
    return [...this.byId.keys()];
  }

  listByAxis(axis: FactoryVariantOverlayAxis): FactoryVariantOverlaySchema[] {
    if (!isFactoryVariantOverlayAxis(axis)) {
      throw new FactoryVariantOverlayRegistryError(
        "malformed-input",
        `Cannot list overlays: unsupported axis "${String(axis)}".`,
        { field: "axis" },
      );
    }
    const prefix = `${axis}:`;
    return this.list().filter((overlay) => overlay.id.startsWith(prefix));
  }
}

/**
 * Register one canonical overlay for every value in the inventory.
 */
export function createFactoryVariantOverlayRegistryFromInventory(
  inventory: FactoryVariantEnumInventory,
): FactoryVariantOverlayRegistry {
  const registry = new FactoryVariantOverlayRegistry();

  for (const value of inventory.workerTypes) {
    registry.register(createCanonicalFactoryVariantOverlay("worker", value));
  }
  for (const value of inventory.workstationTypes) {
    registry.register(
      createCanonicalFactoryVariantOverlay("workstation", value),
    );
  }
  for (const value of inventory.workstationBehaviors) {
    registry.register(createCanonicalFactoryVariantOverlay("behavior", value));
  }

  assertFactoryVariantOverlayRegistryComplete(registry, inventory);
  return registry;
}

/**
 * Fail closed when the registry is missing an inventory enum value or contains
 * an overlay ID that is not in the inventory (unknown / extra overlays).
 */
export function assertFactoryVariantOverlayRegistryComplete(
  registry: FactoryVariantOverlayRegistry,
  inventory: FactoryVariantEnumInventory,
): void {
  const expected = new Set(expectedFactoryVariantOverlayIds(inventory));
  const actual = new Set(registry.listIds());

  for (const overlayId of expected) {
    if (!actual.has(overlayId)) {
      throw new FactoryVariantOverlayRegistryError(
        "missing-overlay",
        `Factory variant overlay registry is missing required overlay "${overlayId}" for the installed schema enum inventory.`,
        { overlayId },
      );
    }
  }

  for (const overlayId of actual) {
    if (!expected.has(overlayId)) {
      throw new FactoryVariantOverlayRegistryError(
        "unknown-overlay",
        `Factory variant overlay registry contains unknown overlay "${overlayId}" that is not in the installed schema enum inventory.`,
        { overlayId },
      );
    }
  }
}
