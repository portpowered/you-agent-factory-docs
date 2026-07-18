/**
 * Worker/Workstation variant companion compatibility matrix (W06).
 *
 * Records authored compatibility facts linking Worker type, Workstation type,
 * and Workstation behavior overlays by stable overlay ID. Pure data +
 * registry-backed validation — no package IO and no UI.
 *
 * Companion matrix contents may start minimal; the contract shape stays fixed
 * so later W13/W14 page authorship can deepen facts without a second matrix
 * story. Required/compatible references fail closed when they point at overlay
 * IDs absent from the registry.
 */

import type { FactoryVariantOverlayRegistry } from "./factory-variant-overlay-registry";
import {
  buildFactoryVariantOverlayId,
  parseFactoryVariantOverlayId,
} from "./factory-variant-overlay-registry";
import type {
  FactoryVariantCompanionRefs,
  FactoryVariantOverlayId,
  FactoryVariantOverlaySchema,
} from "./factory-variant-overlay-schema";

/**
 * One authored compatibility fact for a single overlay.
 * Companion IDs are overlay identities only — never page prose.
 */
export type FactoryVariantCompatibilityFact = {
  overlayId: FactoryVariantOverlayId;
  companions: FactoryVariantCompanionRefs;
};

/**
 * Authored compatibility matrix keyed by overlay ID.
 * Facts are plain records suitable for JSON serialization.
 */
export type FactoryVariantCompatibilityMatrix = {
  facts: FactoryVariantCompatibilityFact[];
};

export type FactoryVariantCompatibilityErrorCode =
  | "malformed-input"
  | "duplicate-fact"
  | "unknown-compatible-companion"
  | "missing-required-companion"
  | "required-not-compatible";

export class FactoryVariantCompatibilityError extends Error {
  readonly code: FactoryVariantCompatibilityErrorCode;
  readonly overlayId?: string;
  readonly companionId?: string;
  readonly field?: string;

  constructor(
    code: FactoryVariantCompatibilityErrorCode,
    message: string,
    options: {
      overlayId?: string;
      companionId?: string;
      field?: string;
      cause?: unknown;
    } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "FactoryVariantCompatibilityError";
    this.code = code;
    this.overlayId = options.overlayId;
    this.companionId = options.companionId;
    this.field = options.field;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new FactoryVariantCompatibilityError(
      "malformed-input",
      `Malformed FactoryVariantCompatibilityFact: field "${field}" must be a non-empty string.`,
      { field },
    );
  }
  return value;
}

function requireOverlayIdArray(
  value: unknown,
  field: string,
): FactoryVariantOverlayId[] {
  if (!Array.isArray(value)) {
    throw new FactoryVariantCompatibilityError(
      "malformed-input",
      `Malformed FactoryVariantCompatibilityFact: field "${field}" must be an array of overlay IDs.`,
      { field },
    );
  }
  return value.map((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0) {
      throw new FactoryVariantCompatibilityError(
        "malformed-input",
        `Malformed FactoryVariantCompatibilityFact: field "${field}[${index}]" must be a non-empty string.`,
        { field: `${field}[${index}]` },
      );
    }
    return entry;
  });
}

function parseCompanionRefs(
  value: unknown,
  overlayId: FactoryVariantOverlayId,
): FactoryVariantCompanionRefs {
  if (!isPlainObject(value)) {
    throw new FactoryVariantCompatibilityError(
      "malformed-input",
      `Malformed FactoryVariantCompatibilityFact for overlay "${overlayId}": field "companions" must be an object.`,
      { overlayId, field: "companions" },
    );
  }

  return {
    compatible: requireOverlayIdArray(
      value.compatible,
      "companions.compatible",
    ),
    required: requireOverlayIdArray(value.required, "companions.required"),
  };
}

/**
 * Parse unknown JSON-shaped data into one compatibility fact.
 */
export function parseFactoryVariantCompatibilityFact(
  value: unknown,
): FactoryVariantCompatibilityFact {
  if (!isPlainObject(value)) {
    throw new FactoryVariantCompatibilityError(
      "malformed-input",
      "Malformed FactoryVariantCompatibilityFact: expected a plain object.",
    );
  }

  const overlayId = requireNonEmptyString(value.overlayId, "overlayId");
  // Fail closed early on malformed overlay ID shapes (axis:value).
  parseFactoryVariantOverlayId(overlayId);

  return {
    overlayId,
    companions: parseCompanionRefs(value.companions, overlayId),
  };
}

/**
 * Build a plain compatibility fact (identity + companion refs only).
 */
export function createFactoryVariantCompatibilityFact(
  input: FactoryVariantCompatibilityFact,
): FactoryVariantCompatibilityFact {
  return parseFactoryVariantCompatibilityFact(input);
}

/**
 * Parse unknown JSON-shaped data into a compatibility matrix.
 */
export function parseFactoryVariantCompatibilityMatrix(
  value: unknown,
): FactoryVariantCompatibilityMatrix {
  if (!isPlainObject(value)) {
    throw new FactoryVariantCompatibilityError(
      "malformed-input",
      "Malformed FactoryVariantCompatibilityMatrix: expected a plain object.",
    );
  }

  if (!Array.isArray(value.facts)) {
    throw new FactoryVariantCompatibilityError(
      "malformed-input",
      `Malformed FactoryVariantCompatibilityMatrix: field "facts" must be an array.`,
      { field: "facts" },
    );
  }

  const facts = value.facts.map((entry, index) => {
    try {
      return parseFactoryVariantCompatibilityFact(entry);
    } catch (cause) {
      if (cause instanceof FactoryVariantCompatibilityError) {
        throw new FactoryVariantCompatibilityError(
          cause.code,
          `Malformed FactoryVariantCompatibilityMatrix facts[${index}]: ${cause.message}`,
          {
            overlayId: cause.overlayId,
            companionId: cause.companionId,
            field: cause.field ?? `facts[${index}]`,
            cause,
          },
        );
      }
      throw cause;
    }
  });

  return createFactoryVariantCompatibilityMatrix({ facts });
}

/**
 * Build a matrix from authored facts. Fails closed on duplicate overlay IDs.
 */
export function createFactoryVariantCompatibilityMatrix(input: {
  facts: readonly FactoryVariantCompatibilityFact[];
}): FactoryVariantCompatibilityMatrix {
  const seen = new Set<FactoryVariantOverlayId>();
  const facts: FactoryVariantCompatibilityFact[] = [];

  for (const raw of input.facts) {
    const fact = createFactoryVariantCompatibilityFact(raw);
    if (seen.has(fact.overlayId)) {
      throw new FactoryVariantCompatibilityError(
        "duplicate-fact",
        `FactoryVariantCompatibilityMatrix already contains a fact for overlay "${fact.overlayId}".`,
        { overlayId: fact.overlayId, field: "overlayId" },
      );
    }
    seen.add(fact.overlayId);
    facts.push(fact);
  }

  return { facts };
}

/**
 * Serialize a matrix to JSON. Round-trips through
 * `parseFactoryVariantCompatibilityMatrix(JSON.parse(...))`.
 */
export function serializeFactoryVariantCompatibilityMatrix(
  matrix: FactoryVariantCompatibilityMatrix,
): string {
  return JSON.stringify(createFactoryVariantCompatibilityMatrix(matrix));
}

/**
 * Parse a JSON string previously produced by
 * `serializeFactoryVariantCompatibilityMatrix`.
 */
export function deserializeFactoryVariantCompatibilityMatrix(
  json: string,
): FactoryVariantCompatibilityMatrix {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    throw new FactoryVariantCompatibilityError(
      "malformed-input",
      "Malformed FactoryVariantCompatibilityMatrix JSON: could not parse text.",
      { cause },
    );
  }
  return parseFactoryVariantCompatibilityMatrix(parsed);
}

/**
 * Look up companion refs for one overlay ID in the matrix.
 * Returns undefined when no fact is authored for that overlay.
 */
export function getFactoryVariantCompatibilityFact(
  matrix: FactoryVariantCompatibilityMatrix,
  overlayId: FactoryVariantOverlayId,
): FactoryVariantCompatibilityFact | undefined {
  return matrix.facts.find((fact) => fact.overlayId === overlayId);
}

/**
 * Index matrix facts by overlay ID (insertion order preserved via Map).
 */
export function indexFactoryVariantCompatibilityFacts(
  matrix: FactoryVariantCompatibilityMatrix,
): Map<FactoryVariantOverlayId, FactoryVariantCompatibilityFact> {
  const byId = new Map<
    FactoryVariantOverlayId,
    FactoryVariantCompatibilityFact
  >();
  for (const fact of matrix.facts) {
    byId.set(fact.overlayId, fact);
  }
  return byId;
}

/**
 * Validate companion refs against a registry.
 *
 * - Compatible companions that reference unknown overlay IDs fail closed.
 * - Required companions absent from the registry fail closed.
 * - Required companions must also appear in the compatible list (required
 *   implies compatible).
 *
 * Diagnostics always name the overlay and the offending companion identity.
 */
export function validateFactoryVariantCompanionRefs(
  overlayId: FactoryVariantOverlayId,
  companions: FactoryVariantCompanionRefs,
  registry: Pick<FactoryVariantOverlayRegistry, "has">,
): void {
  if (typeof overlayId !== "string" || overlayId.length === 0) {
    throw new FactoryVariantCompatibilityError(
      "malformed-input",
      "Cannot validate companions: overlay ID must be a non-empty string.",
      { field: "overlayId" },
    );
  }
  if (!isPlainObject(companions)) {
    throw new FactoryVariantCompatibilityError(
      "malformed-input",
      `Cannot validate companions for overlay "${overlayId}": companions must be an object.`,
      { overlayId, field: "companions" },
    );
  }
  if (
    !Array.isArray(companions.compatible) ||
    !Array.isArray(companions.required)
  ) {
    throw new FactoryVariantCompatibilityError(
      "malformed-input",
      `Cannot validate companions for overlay "${overlayId}": companions.compatible and companions.required must be arrays.`,
      { overlayId, field: "companions" },
    );
  }

  const compatibleSet = new Set(companions.compatible);

  // Required companions first so absence surfaces as missing-required rather
  // than the broader unknown-compatible diagnostic when the same ID appears in
  // both lists.
  for (const companionId of companions.required) {
    if (typeof companionId !== "string" || companionId.length === 0) {
      throw new FactoryVariantCompatibilityError(
        "malformed-input",
        `Overlay "${overlayId}" lists a malformed required companion identity.`,
        { overlayId, field: "companions.required" },
      );
    }
    if (!registry.has(companionId)) {
      throw new FactoryVariantCompatibilityError(
        "missing-required-companion",
        `Overlay "${overlayId}" requires companion "${companionId}" which is absent from the Factory variant overlay registry.`,
        {
          overlayId,
          companionId,
          field: "companions.required",
        },
      );
    }
    if (!compatibleSet.has(companionId)) {
      throw new FactoryVariantCompatibilityError(
        "required-not-compatible",
        `Overlay "${overlayId}" requires companion "${companionId}" but does not list it under companions.compatible (required implies compatible).`,
        {
          overlayId,
          companionId,
          field: "companions.required",
        },
      );
    }
  }

  for (const companionId of companions.compatible) {
    if (typeof companionId !== "string" || companionId.length === 0) {
      throw new FactoryVariantCompatibilityError(
        "malformed-input",
        `Overlay "${overlayId}" lists a malformed compatible companion identity.`,
        { overlayId, field: "companions.compatible" },
      );
    }
    if (!registry.has(companionId)) {
      throw new FactoryVariantCompatibilityError(
        "unknown-compatible-companion",
        `Overlay "${overlayId}" lists compatible companion "${companionId}" that is not present in the Factory variant overlay registry.`,
        {
          overlayId,
          companionId,
          field: "companions.compatible",
        },
      );
    }
  }
}

/**
 * Validate every authored matrix fact against the overlay registry.
 */
export function validateFactoryVariantCompatibilityMatrix(
  matrix: FactoryVariantCompatibilityMatrix,
  registry: Pick<FactoryVariantOverlayRegistry, "has">,
): void {
  const parsed = createFactoryVariantCompatibilityMatrix(matrix);
  for (const fact of parsed.facts) {
    if (!registry.has(fact.overlayId)) {
      throw new FactoryVariantCompatibilityError(
        "malformed-input",
        `FactoryVariantCompatibilityMatrix fact overlay "${fact.overlayId}" is not present in the Factory variant overlay registry.`,
        { overlayId: fact.overlayId, field: "overlayId" },
      );
    }
    validateFactoryVariantCompanionRefs(
      fact.overlayId,
      fact.companions,
      registry,
    );
  }
}

/**
 * Validate companions declared on an overlay schema against the registry.
 */
export function validateFactoryVariantOverlayCompanions(
  overlay: Pick<FactoryVariantOverlaySchema, "id" | "companions">,
  registry: Pick<FactoryVariantOverlayRegistry, "has">,
): void {
  validateFactoryVariantCompanionRefs(overlay.id, overlay.companions, registry);
}

/**
 * Merge matrix companion facts onto an overlay's companion slots.
 * Overlays without a matrix fact keep their existing companions unchanged.
 */
export function applyFactoryVariantCompatibilityFactToOverlay(
  overlay: FactoryVariantOverlaySchema,
  matrix: FactoryVariantCompatibilityMatrix,
): FactoryVariantOverlaySchema {
  const fact = getFactoryVariantCompatibilityFact(matrix, overlay.id);
  if (fact === undefined) {
    return overlay;
  }
  return {
    ...overlay,
    companions: {
      compatible: [...fact.companions.compatible],
      required: [...fact.companions.required],
    },
  };
}

/**
 * Minimal authored Worker ↔ Workstation type compatibility facts.
 *
 * Name-aligned pairs plus model-family companions. Behavior overlays are
 * intentionally omitted here — `type` and `behavior` are independent axes;
 * workstation facts list all published behaviors as compatible companions.
 * Concrete editorial depth can grow with W13/W14 without changing this shape.
 */
export function createMinimalFactoryVariantCompatibilityFacts(): FactoryVariantCompatibilityFact[] {
  const behaviorIds = ["STANDARD", "REPEATER", "CRON", "POLLER"].map((value) =>
    buildFactoryVariantOverlayId("behavior", value),
  );

  const workerWorkstationPairs: Array<{
    worker: string;
    workstations: string[];
  }> = [
    { worker: "INFERENCE_WORKER", workstations: ["INFERENCE_RUN"] },
    { worker: "AGENT_WORKER", workstations: ["AGENT_RUN"] },
    { worker: "SCRIPT_WORKER", workstations: ["SCRIPT_RUN"] },
    { worker: "POLLER_WORKER", workstations: ["POLLER_RUN"] },
    {
      worker: "MODEL_WORKER",
      workstations: ["MODEL_WORKSTATION", "MODEL_INVOKE"],
    },
    {
      worker: "HOSTED_WORKER",
      workstations: ["LOGICAL_MOVE", "CLASSIFIER_WORKSTATION"],
    },
  ];

  const facts: FactoryVariantCompatibilityFact[] = [];

  for (const pair of workerWorkstationPairs) {
    const workerId = buildFactoryVariantOverlayId("worker", pair.worker);
    const workstationIds = pair.workstations.map((value) =>
      buildFactoryVariantOverlayId("workstation", value),
    );

    const primaryWorkstationId = workstationIds[0];
    if (primaryWorkstationId === undefined) {
      throw new FactoryVariantCompatibilityError(
        "malformed-input",
        `Minimal compatibility fact for "${workerId}" requires at least one workstation companion.`,
        { overlayId: workerId, field: "companions.required" },
      );
    }

    facts.push(
      createFactoryVariantCompatibilityFact({
        overlayId: workerId,
        companions: {
          compatible: [...workstationIds],
          required: [primaryWorkstationId],
        },
      }),
    );

    for (const workstationId of workstationIds) {
      facts.push(
        createFactoryVariantCompatibilityFact({
          overlayId: workstationId,
          companions: {
            compatible: [workerId, ...behaviorIds],
            required: [workerId],
          },
        }),
      );
    }
  }

  for (const behaviorId of behaviorIds) {
    facts.push(
      createFactoryVariantCompatibilityFact({
        overlayId: behaviorId,
        companions: {
          compatible: workerWorkstationPairs.flatMap((pair) =>
            pair.workstations.map((value) =>
              buildFactoryVariantOverlayId("workstation", value),
            ),
          ),
          required: [],
        },
      }),
    );
  }

  return facts;
}

/**
 * Build the minimal authored compatibility matrix for current Factory variants.
 */
export function createMinimalFactoryVariantCompatibilityMatrix(): FactoryVariantCompatibilityMatrix {
  return createFactoryVariantCompatibilityMatrix({
    facts: createMinimalFactoryVariantCompatibilityFacts(),
  });
}
