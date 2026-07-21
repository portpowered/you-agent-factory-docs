/**
 * Pure SchemaReference input resolution for complete vs addressed modes.
 *
 * Derives ready/empty/invalid outcomes from W04 models and addresses without
 * mutating canonical schema data. Callers pass already-normalized definitions.
 */

import {
  formatSchemaAddress,
  type SchemaAddress,
  type SchemaDefinitionModel,
} from "@/lib/references/schema-model";
import {
  SCHEMA_UI_STATUS_DEFAULT_MESSAGES,
  SCHEMA_UI_STATUS_DEFAULT_TITLES,
  type SchemaUiStatus,
  type SchemaUiStatusKind,
} from "./types";

export type SchemaReferenceMode = "complete" | "addressed";

export type SchemaReferenceReadyResolution = {
  status: "ready";
  mode: SchemaReferenceMode;
  /** Primary definition rendered via SchemaDefinition. */
  definition: SchemaDefinitionModel;
  /**
   * Flat catalog for filter / listing in complete mode (excludes the primary
   * root when it is the complete-mode definition).
   */
  catalog: readonly SchemaDefinitionModel[];
};

export type SchemaReferenceStatusResolution = {
  status: SchemaUiStatusKind;
  title: string;
  message: string;
};

export type SchemaReferenceResolution =
  | SchemaReferenceReadyResolution
  | SchemaReferenceStatusResolution;

export type ResolveSchemaReferenceInput = {
  /** Explicit status override (including `ready`). */
  status?: SchemaUiStatus;
  statusTitle?: string;
  statusMessage?: string;
  /** Root definition for complete-schema mode. */
  root?: SchemaDefinitionModel;
  /** Flat definition catalog for listing, filter, and address lookup. */
  definitions?: readonly SchemaDefinitionModel[];
  /** Address selecting a single definition (addressed mode). */
  address?: SchemaAddress;
  /** Pre-resolved definition (addressed mode or lookup preference). */
  definition?: SchemaDefinitionModel;
};

const MISSING_ADDRESS_TITLE = "Invalid address";
const MISSING_ADDRESS_MESSAGE =
  "The addressed schema definition was not found in the provided catalog.";
const EMPTY_SCHEMA_TITLE = SCHEMA_UI_STATUS_DEFAULT_TITLES.empty;
const EMPTY_SCHEMA_MESSAGE = SCHEMA_UI_STATUS_DEFAULT_MESSAGES.empty;

function isSchemaDefinitionModel(
  value: unknown,
): value is SchemaDefinitionModel {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "address" in value &&
    typeof (value as SchemaDefinitionModel).address === "object" &&
    (value as SchemaDefinitionModel).address !== null &&
    typeof (value as SchemaDefinitionModel).address.publicArtifactId ===
      "string" &&
    typeof (value as SchemaDefinitionModel).address.pointer === "string"
  );
}

/** Compare two W04 schema addresses by artifact id + pointer. */
export function schemaAddressesEqual(
  a: SchemaAddress,
  b: SchemaAddress,
): boolean {
  return a.publicArtifactId === b.publicArtifactId && a.pointer === b.pointer;
}

/**
 * Index a definition and any nested full `$defs` models into a map keyed by
 * `formatSchemaAddress`. Does not invent definitions from bare addresses.
 */
function indexDefinition(
  definition: SchemaDefinitionModel,
  into: Map<string, SchemaDefinitionModel>,
): void {
  into.set(formatSchemaAddress(definition.address), definition);
  if (definition.definitions === undefined) {
    return;
  }
  for (const nested of Object.values(definition.definitions)) {
    if (isSchemaDefinitionModel(nested)) {
      indexDefinition(nested, into);
    }
  }
}

/**
 * Build a flat lookup catalog from an optional root and definition list.
 * Nested `$defs` full models are included; bare address stubs are skipped.
 */
export function collectSchemaReferenceCatalog(options: {
  root?: SchemaDefinitionModel;
  definitions?: readonly SchemaDefinitionModel[];
}): SchemaDefinitionModel[] {
  const byKey = new Map<string, SchemaDefinitionModel>();
  if (options.definitions !== undefined) {
    for (const definition of options.definitions) {
      indexDefinition(definition, byKey);
    }
  }
  if (options.root !== undefined) {
    indexDefinition(options.root, byKey);
  }
  return [...byKey.values()];
}

/**
 * Find a definition by address from explicit props, catalog, or root nesting.
 */
export function findSchemaDefinitionByAddress(
  address: SchemaAddress,
  options: {
    definition?: SchemaDefinitionModel;
    definitions?: readonly SchemaDefinitionModel[];
    root?: SchemaDefinitionModel;
  },
): SchemaDefinitionModel | undefined {
  if (
    options.definition !== undefined &&
    schemaAddressesEqual(options.definition.address, address)
  ) {
    return options.definition;
  }

  const catalog = collectSchemaReferenceCatalog({
    root: options.root,
    definitions: options.definitions,
  });
  const key = formatSchemaAddress(address);
  for (const entry of catalog) {
    if (formatSchemaAddress(entry.address) === key) {
      return entry;
    }
  }
  return undefined;
}

function statusResolution(
  kind: SchemaUiStatusKind,
  title?: string,
  message?: string,
): SchemaReferenceStatusResolution {
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
 * Resolve SchemaReference props into a ready complete/addressed view or an
 * explicit status outcome. Never throws on missing addresses.
 */
export function resolveSchemaReferenceInput(
  input: ResolveSchemaReferenceInput,
): SchemaReferenceResolution {
  if (input.status !== undefined && input.status !== "ready") {
    return statusResolution(
      input.status,
      input.statusTitle,
      input.statusMessage,
    );
  }

  const catalog = collectSchemaReferenceCatalog({
    root: input.root,
    definitions: input.definitions,
  });

  if (input.address !== undefined) {
    const resolved = findSchemaDefinitionByAddress(input.address, {
      definition: input.definition,
      definitions: input.definitions,
      root: input.root,
    });
    if (resolved === undefined) {
      return statusResolution(
        "invalid",
        input.statusTitle ?? MISSING_ADDRESS_TITLE,
        input.statusMessage ?? MISSING_ADDRESS_MESSAGE,
      );
    }
    const catalogWithoutPrimary = catalog.filter(
      (entry) => !schemaAddressesEqual(entry.address, resolved.address),
    );
    return {
      status: "ready",
      mode: "addressed",
      definition: resolved,
      catalog: catalogWithoutPrimary,
    };
  }

  if (input.definition !== undefined) {
    const addressed = input.definition;
    const catalogWithoutPrimary = catalog.filter(
      (entry) => !schemaAddressesEqual(entry.address, addressed.address),
    );
    return {
      status: "ready",
      mode: "addressed",
      definition: addressed,
      catalog: catalogWithoutPrimary,
    };
  }

  if (input.root !== undefined) {
    const rootDefinition = input.root;
    const catalogWithoutRoot = catalog.filter(
      (entry) => !schemaAddressesEqual(entry.address, rootDefinition.address),
    );
    return {
      status: "ready",
      mode: "complete",
      definition: rootDefinition,
      catalog: catalogWithoutRoot,
    };
  }

  if (catalog.length > 0) {
    const [primary, ...rest] = catalog;
    if (primary === undefined) {
      return statusResolution(
        "empty",
        input.statusTitle ?? EMPTY_SCHEMA_TITLE,
        input.statusMessage ?? EMPTY_SCHEMA_MESSAGE,
      );
    }
    return {
      status: "ready",
      mode: "complete",
      definition: primary,
      catalog: rest,
    };
  }

  return statusResolution(
    "empty",
    input.statusTitle ?? EMPTY_SCHEMA_TITLE,
    input.statusMessage ?? EMPTY_SCHEMA_MESSAGE,
  );
}
