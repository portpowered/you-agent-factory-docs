/**
 * Cycle-safe `$ref` and discriminator cross-link resolver for W04.
 *
 * Pure build-time helpers — no filesystem, package resolution, or UI. Resolves
 * internal refs and discriminator mappings to normalized schema addresses (and
 * deterministic anchors) while preserving originating source pointers for
 * diagnostics and source badges. Never hangs on cyclic graphs and never
 * invents missing definitions.
 */

import { anchorForIdentity } from "./reference-anchor-registry";
import type { ReferenceSourcePointer } from "./reference-item";
import {
  createSchemaAddress,
  formatSchemaAddress,
  type SchemaAddress,
  type SchemaDefinitionModel,
  type SchemaDiscriminatorModel,
} from "./schema-model";

/** Outcome kinds for a single cross-link resolution attempt. */
export const CROSS_LINK_OUTCOME_KINDS = [
  "resolved",
  "cycle",
  "missing",
  "malformed",
] as const;

export type CrossLinkOutcomeKind = (typeof CROSS_LINK_OUTCOME_KINDS)[number];

/**
 * Successful resolution of a `$ref` or discriminator mapping target.
 * `source` is always the originating node pointer (never rewritten to the
 * target) so diagnostics and source badges can cite origin.
 */
export type ResolvedCrossLink = {
  kind: "resolved";
  source: ReferenceSourcePointer;
  target: SchemaAddress;
  /** URL-safe fragment for the target schema pointer (no leading `#`). */
  anchor: string;
  /** How many `$ref` hops were followed from the initial request (0 = direct). */
  depth: number;
};

/**
 * Cycle sentinel: following `$ref` re-entered an address already on the path.
 * Does not invent a definition; callers should render a link, not expand.
 */
export type CycleCrossLink = {
  kind: "cycle";
  source: ReferenceSourcePointer;
  /** The `$ref` target that would continue the walk. */
  target: SchemaAddress;
  /** Address that was re-entered. */
  cycleAt: SchemaAddress;
  /** Addresses visited on the path, including `cycleAt` at the end. */
  path: SchemaAddress[];
};

/** Target address parses but is not present in the resolver catalog. */
export type MissingCrossLink = {
  kind: "missing";
  source: ReferenceSourcePointer;
  target: SchemaAddress;
};

/** `$ref` string / value could not be parsed into a SchemaAddress. */
export type MalformedCrossLink = {
  kind: "malformed";
  source: ReferenceSourcePointer;
  /** Raw ref string when the input was a string. */
  rawRef?: string;
  message: string;
};

export type ReferenceCrossLinkOutcome =
  | ResolvedCrossLink
  | CycleCrossLink
  | MissingCrossLink
  | MalformedCrossLink;

export type ResolveDiscriminatorResult = {
  propertyName: string;
  /** One outcome per mapping key; keys preserve declaration order when provided. */
  mappings: Record<string, ReferenceCrossLinkOutcome>;
};

export type ReferenceCrossLinkResolverErrorCode =
  | "malformed-input"
  | "unknown-definition";

export class ReferenceCrossLinkResolverError extends Error {
  readonly code: ReferenceCrossLinkResolverErrorCode;
  readonly field?: string;

  constructor(
    code: ReferenceCrossLinkResolverErrorCode,
    message: string,
    options: { field?: string; cause?: unknown } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "ReferenceCrossLinkResolverError";
    this.code = code;
    this.field = options.field;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneSource(source: ReferenceSourcePointer): ReferenceSourcePointer {
  if (
    typeof source.publicArtifactId !== "string" ||
    source.publicArtifactId.length === 0 ||
    typeof source.pointer !== "string" ||
    source.pointer.length === 0
  ) {
    throw new ReferenceCrossLinkResolverError(
      "malformed-input",
      "Malformed cross-link source: publicArtifactId and pointer must be non-empty strings.",
      { field: "source" },
    );
  }
  const cloned: ReferenceSourcePointer = {
    publicArtifactId: source.publicArtifactId,
    pointer: source.pointer,
  };
  if (typeof source.path === "string" && source.path.length > 0) {
    cloned.path = source.path;
  }
  return cloned;
}

function addressKey(address: SchemaAddress): string {
  return formatSchemaAddress(address);
}

function cloneAddress(address: SchemaAddress): SchemaAddress {
  return createSchemaAddress(address);
}

function addressesEqual(a: SchemaAddress, b: SchemaAddress): boolean {
  return a.publicArtifactId === b.publicArtifactId && a.pointer === b.pointer;
}

/**
 * Normalize a JSON Pointer-ish string to a leading-`/` pointer.
 * Accepts `/foo`, `#/foo`, and `foo` forms.
 */
export function normalizeJsonPointer(pointer: string): string {
  let normalized = pointer.trim();
  if (normalized.startsWith("#")) {
    normalized = normalized.slice(1);
  }
  if (normalized.length === 0) {
    return "";
  }
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  return normalized;
}

/**
 * Parse a `$ref` string or SchemaAddress into a normalized SchemaAddress.
 * Local `#/…` and `/…` refs inherit `defaultPublicArtifactId`.
 * Absolute `artifactId#/pointer` forms are also accepted.
 */
export function parseRefToSchemaAddress(
  ref: string | SchemaAddress,
  defaultPublicArtifactId: string,
): SchemaAddress {
  if (typeof ref !== "string") {
    if (!isPlainObject(ref)) {
      throw new ReferenceCrossLinkResolverError(
        "malformed-input",
        "Malformed $ref: expected a string or SchemaAddress object.",
        { field: "ref" },
      );
    }
    return createSchemaAddress(ref);
  }

  const trimmed = ref.trim();
  if (trimmed.length === 0) {
    throw new ReferenceCrossLinkResolverError(
      "malformed-input",
      "Malformed $ref: empty string is not a valid reference.",
      { field: "ref" },
    );
  }

  // Absolute `publicArtifactId#pointer` (pointer may be `#/…` or `/…`).
  const hashIndex = trimmed.indexOf("#");
  if (hashIndex > 0 && !trimmed.startsWith("#") && !trimmed.startsWith("/")) {
    const publicArtifactId = trimmed.slice(0, hashIndex).trim();
    const pointerPart = trimmed.slice(hashIndex);
    const pointer = normalizeJsonPointer(pointerPart);
    if (publicArtifactId.length === 0 || pointer.length === 0) {
      throw new ReferenceCrossLinkResolverError(
        "malformed-input",
        `Malformed $ref "${trimmed}": expected publicArtifactId#/pointer.`,
        { field: "ref" },
      );
    }
    return createSchemaAddress({ publicArtifactId, pointer });
  }

  if (defaultPublicArtifactId.trim().length === 0) {
    throw new ReferenceCrossLinkResolverError(
      "malformed-input",
      "Cannot resolve a local $ref without a non-empty defaultPublicArtifactId.",
      { field: "defaultPublicArtifactId" },
    );
  }

  const pointer = normalizeJsonPointer(trimmed);
  if (pointer.length === 0) {
    throw new ReferenceCrossLinkResolverError(
      "malformed-input",
      `Malformed $ref "${trimmed}": pointer is empty after normalization.`,
      { field: "ref" },
    );
  }

  return createSchemaAddress({
    publicArtifactId: defaultPublicArtifactId,
    pointer,
  });
}

function schemaPointerAnchor(target: SchemaAddress): string {
  return anchorForIdentity("schema-pointer", target.pointer);
}

export type ReferenceCrossLinkResolverOptions = {
  /**
   * Known schema definitions available for lookup. Only addresses present here
   * can resolve; unknown targets yield `missing` outcomes.
   */
  definitions?: Iterable<SchemaDefinitionModel>;
};

function isSchemaDefinitionModel(
  value: unknown,
): value is SchemaDefinitionModel {
  return (
    isPlainObject(value) &&
    isPlainObject(value.address) &&
    typeof value.address.publicArtifactId === "string" &&
    typeof value.address.pointer === "string"
  );
}

/**
 * Build-time resolver for `$ref` and discriminator links.
 * Catalog membership is explicit — callers register definitions; the resolver
 * never invents missing targets or expands cyclic graphs unbounded.
 */
export class ReferenceCrossLinkResolver {
  private readonly definitions = new Map<string, SchemaDefinitionModel>();

  constructor(options: ReferenceCrossLinkResolverOptions = {}) {
    if (options.definitions !== undefined) {
      for (const definition of options.definitions) {
        this.registerDefinition(definition);
      }
    }
  }

  /**
   * Register (or replace) a definition in the lookup catalog keyed by its
   * address. Nested `$defs` addresses that are full models are also indexed.
   */
  registerDefinition(definition: SchemaDefinitionModel): void {
    if (!isSchemaDefinitionModel(definition)) {
      throw new ReferenceCrossLinkResolverError(
        "malformed-input",
        "Cannot register a schema definition without an address.",
        { field: "definition.address" },
      );
    }
    const address = createSchemaAddress(definition.address);
    this.definitions.set(addressKey(address), definition);

    if (definition.definitions !== undefined) {
      for (const nested of Object.values(definition.definitions)) {
        // Full nested models carry `address`; deferred entries are bare SchemaAddress.
        if (isSchemaDefinitionModel(nested)) {
          this.registerDefinition(nested);
        }
      }
    }
  }

  getDefinition(address: SchemaAddress): SchemaDefinitionModel | undefined {
    return this.definitions.get(addressKey(createSchemaAddress(address)));
  }

  hasDefinition(address: SchemaAddress): boolean {
    return this.definitions.has(addressKey(createSchemaAddress(address)));
  }

  /**
   * Resolve a single `$ref` hop to a normalized address/anchor outcome.
   * Does not follow further `refTarget` chains — use `resolveRefChain` for that.
   * When `visited` already contains the target, returns a `cycle` sentinel.
   */
  resolveRef(input: {
    source: ReferenceSourcePointer;
    ref: string | SchemaAddress;
    visited?: readonly SchemaAddress[];
  }): ReferenceCrossLinkOutcome {
    const source = cloneSource(input.source);
    let target: SchemaAddress;
    try {
      target = parseRefToSchemaAddress(input.ref, source.publicArtifactId);
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : `Malformed $ref could not be parsed.`;
      const rawRef = typeof input.ref === "string" ? input.ref : undefined;
      return {
        kind: "malformed",
        source,
        ...(rawRef !== undefined ? { rawRef } : {}),
        message,
      };
    }

    const visited = input.visited ?? [];
    for (const prior of visited) {
      if (addressesEqual(prior, target)) {
        return {
          kind: "cycle",
          source,
          target: cloneAddress(target),
          cycleAt: cloneAddress(target),
          path: [...visited.map(cloneAddress), cloneAddress(target)],
        };
      }
    }

    if (!this.hasDefinition(target)) {
      return {
        kind: "missing",
        source,
        target: cloneAddress(target),
      };
    }

    return {
      kind: "resolved",
      source,
      target: cloneAddress(target),
      anchor: schemaPointerAnchor(target),
      depth: 0,
    };
  }

  /**
   * Follow `$ref` / `refTarget` links until a terminal definition, a missing
   * target, a malformed ref, or a cycle. Never expands unboundedly.
   */
  resolveRefChain(input: {
    source: ReferenceSourcePointer;
    ref: string | SchemaAddress;
    /** Safety cap; defaults to the catalog size + 1 (still cycle-safe). */
    maxDepth?: number;
  }): ReferenceCrossLinkOutcome {
    const source = cloneSource(input.source);
    const maxDepth = input.maxDepth ?? Math.max(this.definitions.size + 1, 8);

    const visited: SchemaAddress[] = [];
    let currentRef: string | SchemaAddress = input.ref;
    let depth = 0;

    while (depth <= maxDepth) {
      const outcome = this.resolveRef({
        source,
        ref: currentRef,
        visited,
      });

      if (outcome.kind !== "resolved") {
        return outcome;
      }

      visited.push(cloneAddress(outcome.target));
      const definition = this.getDefinition(outcome.target);
      if (definition === undefined) {
        return {
          kind: "missing",
          source,
          target: cloneAddress(outcome.target),
        };
      }

      if (definition.refTarget === undefined) {
        return {
          kind: "resolved",
          source,
          target: cloneAddress(outcome.target),
          anchor: outcome.anchor,
          depth,
        };
      }

      // Next hop: the definition is itself a `$ref` wrapper.
      currentRef = definition.refTarget;
      depth += 1;
    }

    // Depth cap hit without a cycle detection — treat as cycle-like fail-closed
    // so callers never hang; include the visited path for diagnostics.
    const last = visited[visited.length - 1];
    if (last === undefined) {
      return {
        kind: "malformed",
        source,
        message: `Ref chain aborted before resolving any target (maxDepth=${maxDepth}).`,
      };
    }
    return {
      kind: "cycle",
      source,
      target: cloneAddress(last),
      cycleAt: cloneAddress(last),
      path: visited.map(cloneAddress),
    };
  }

  /**
   * Resolve each discriminator mapping value to a one-hop cross-link outcome.
   * Does not recursively expand mapped definitions (avoids unbounded expansion).
   */
  resolveDiscriminator(input: {
    source: ReferenceSourcePointer;
    discriminator: SchemaDiscriminatorModel;
  }): ResolveDiscriminatorResult {
    const source = cloneSource(input.source);
    const { discriminator } = input;

    if (
      typeof discriminator.propertyName !== "string" ||
      discriminator.propertyName.length === 0
    ) {
      throw new ReferenceCrossLinkResolverError(
        "malformed-input",
        "Discriminator propertyName must be a non-empty string.",
        { field: "discriminator.propertyName" },
      );
    }

    const mappings: Record<string, ReferenceCrossLinkOutcome> = {};
    const mapping = discriminator.mapping ?? {};
    for (const [key, target] of Object.entries(mapping)) {
      mappings[key] = this.resolveRef({
        source: {
          publicArtifactId: source.publicArtifactId,
          pointer: `${source.pointer}/discriminator/mapping/${key}`,
          ...(source.path !== undefined ? { path: source.path } : {}),
        },
        ref: target,
      });
    }

    return {
      propertyName: discriminator.propertyName,
      mappings,
    };
  }
}

export function createReferenceCrossLinkResolver(
  options: ReferenceCrossLinkResolverOptions = {},
): ReferenceCrossLinkResolver {
  return new ReferenceCrossLinkResolver(options);
}
