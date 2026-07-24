/**
 * Pure builders for six distinctive factory-recording/v1 samples aligned to
 * packaged-factories@0.0.2 standard factories (goal, subagent, fusion, review,
 * quorum, tts). Deep-research is intentionally excluded.
 *
 * Packaged factory.json files are not recording-schema-valid as-is (`@you/...`
 * names, worker `promptFile`, some provider enums). This module projects each
 * acquired definition into a recording-safe Factory topology that preserves
 * work-type / workstation identity, then wraps it in a deterministic
 * INITIAL_STRUCTURE_REQUEST history.
 */

import {
  type FactoryRecording,
  parseFactoryRecording,
  safeParseFactoryRecording,
} from "@you-agent-factory/client";
import {
  projectFactoryTopologyAtTick,
  projectFactoryWorkProgressAtTick,
} from "@you-agent-factory/factory-replay";
import type { PackagedFactoryIndexCorpus } from "./index-corpus-model";

/** Standard factories that receive validated recording samples (no deep-research). */
export const PACKAGED_FACTORY_RECORDING_SLUGS = [
  "goal",
  "subagent",
  "fusion",
  "review",
  "quorum",
  "tts",
] as const;

export type PackagedFactoryRecordingSlug =
  (typeof PACKAGED_FACTORY_RECORDING_SLUGS)[number];

export const FACTORY_RECORDING_SCHEMA_VERSION = "factory-recording/v1" as const;

/** Deterministic event timestamp shared by generated corpus recordings. */
export const PACKAGED_FACTORY_RECORDING_EVENT_TIME =
  "2026-07-23T00:00:00.000Z" as const;

export type PackagedFactoryRecordingArtifactPath =
  `${PackagedFactoryRecordingSlug}.factory-recording.v1.json`;

/** Relative path of one generated recording artifact under the generated root. */
export function packagedFactoryRecordingArtifactPath(
  slug: PackagedFactoryRecordingSlug,
): PackagedFactoryRecordingArtifactPath {
  return `${slug}.factory-recording.v1.json`;
}

export type PackagedFactoryRecordingSamplesErrorCode =
  | "missing-recording-corpus-entry"
  | "invalid-recording-factory-projection"
  | "recording-parser-failure"
  | "recording-projection-failure"
  | "duplicate-recording-history";

export class PackagedFactoryRecordingSamplesError extends Error {
  readonly code: PackagedFactoryRecordingSamplesErrorCode;
  readonly childSlug?: PackagedFactoryRecordingSlug;

  constructor(
    code: PackagedFactoryRecordingSamplesErrorCode,
    message: string,
    options?: { childSlug?: PackagedFactoryRecordingSlug; cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryRecordingSamplesError";
    this.code = code;
    if (options?.childSlug !== undefined) {
      this.childSlug = options.childSlug;
    }
  }
}

export type PackagedFactoryRecordingSample = FactoryRecording & {
  schemaVersion: typeof FACTORY_RECORDING_SCHEMA_VERSION;
};

export type PackagedFactoryRecordingSampleArtifact = {
  childSlug: PackagedFactoryRecordingSlug;
  relativePath: PackagedFactoryRecordingArtifactPath;
  recording: PackagedFactoryRecordingSample;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function projectWorkStates(
  value: unknown,
): Array<{ name: string; type: string }> {
  if (!Array.isArray(value)) {
    return [];
  }
  const states: Array<{ name: string; type: string }> = [];
  for (const entry of value) {
    if (!isPlainObject(entry)) {
      continue;
    }
    const name = asString(entry.name);
    const type = asString(entry.type);
    if (name === undefined || type === undefined) {
      continue;
    }
    states.push({ name, type });
  }
  return states;
}

function projectWorkstationIo(value: unknown): Array<{
  workType: string;
  state: string;
}> {
  if (!Array.isArray(value)) {
    return [];
  }
  const io: Array<{ workType: string; state: string }> = [];
  for (const entry of value) {
    if (!isPlainObject(entry)) {
      continue;
    }
    const workType = asString(entry.workType);
    const state = asString(entry.state);
    if (workType === undefined || state === undefined) {
      continue;
    }
    io.push({ workType, state });
  }
  return io;
}

/**
 * Project an acquired packaged factory.json object into a recording-safe
 * Factory definition. Uses the docs-owned child slug as `factory.name` because
 * packaged `@you/...` names are not valid FactoryName values for recordings.
 * Preserves work-type and workstation topology identity; strips package-only
 * fields that fail the public recording schema (for example worker promptFile).
 */
export function projectPackagedFactoryDefinitionForRecording(
  factoryJson: Record<string, unknown>,
  childSlug: PackagedFactoryRecordingSlug,
): Record<string, unknown> {
  const workTypesRaw = factoryJson.workTypes;
  const workTypes = Array.isArray(workTypesRaw)
    ? workTypesRaw.flatMap((entry) => {
        if (!isPlainObject(entry)) {
          return [];
        }
        const name = asString(entry.name);
        if (name === undefined) {
          return [];
        }
        const projected: Record<string, unknown> = {
          name,
          states: projectWorkStates(entry.states),
        };
        if (Array.isArray(entry.handlingBehavior)) {
          projected.handlingBehavior = entry.handlingBehavior.filter(
            (item) => typeof item === "string",
          );
        }
        return [projected];
      })
    : [];

  const workstationsRaw = factoryJson.workstations;
  const workstations = Array.isArray(workstationsRaw)
    ? workstationsRaw.flatMap((entry) => {
        if (!isPlainObject(entry)) {
          return [];
        }
        const name = asString(entry.name);
        if (name === undefined) {
          return [];
        }
        const projected: Record<string, unknown> = {
          name,
          worker: asString(entry.worker) ?? "",
          inputs: projectWorkstationIo(entry.inputs),
        };
        const type = asString(entry.type);
        if (type !== undefined) {
          projected.type = type;
        }
        const behavior = asString(entry.behavior);
        if (behavior !== undefined) {
          projected.behavior = behavior;
        }
        const outputs = projectWorkstationIo(entry.outputs);
        if (outputs.length > 0) {
          projected.outputs = outputs;
        }
        const onContinue = projectWorkstationIo(entry.onContinue);
        if (onContinue.length > 0) {
          projected.onContinue = onContinue;
        }
        const onFailure = projectWorkstationIo(entry.onFailure);
        if (onFailure.length > 0) {
          projected.onFailure = onFailure;
        }
        const onRejection = projectWorkstationIo(entry.onRejection);
        if (onRejection.length > 0) {
          projected.onRejection = onRejection;
        }
        return [projected];
      })
    : [];

  const workersRaw = factoryJson.workers;
  const workers = Array.isArray(workersRaw)
    ? workersRaw.flatMap((entry) => {
        if (!isPlainObject(entry)) {
          return [];
        }
        const name = asString(entry.name);
        if (name === undefined) {
          return [];
        }
        const projected: Record<string, unknown> = { name };
        const type = asString(entry.type);
        if (type !== undefined) {
          projected.type = type;
        }
        const stopToken = asString(entry.stopToken);
        if (stopToken !== undefined) {
          projected.stopToken = stopToken;
        }
        return [projected];
      })
    : [];

  const factory: Record<string, unknown> = {
    name: childSlug,
    workTypes,
    workstations,
  };
  if (workers.length > 0) {
    factory.workers = workers;
  }
  return factory;
}

/**
 * Topology identity fingerprint used to prove recordings are distinctive.
 * Compares recording-safe factory name + work types + workstation IO only.
 */
export function packagedFactoryRecordingTopologyFingerprint(
  factory: Record<string, unknown>,
): string {
  return JSON.stringify({
    name: factory.name ?? null,
    workTypes: factory.workTypes ?? [],
    workstations: factory.workstations ?? [],
  });
}

/**
 * Build one deterministic factory-recording/v1 sample for a recording slug.
 * Does not parse/validate — callers should run {@link validatePackagedFactoryRecordingSample}.
 */
export function buildPackagedFactoryRecordingSample(input: {
  childSlug: PackagedFactoryRecordingSlug;
  factoryJson: Record<string, unknown>;
  /** Optional override for recording id (defaults to packaged-<slug>-sample). */
  id?: string;
  title?: string;
  summary?: string;
}): PackagedFactoryRecordingSample {
  const { childSlug, factoryJson } = input;
  const factory = projectPackagedFactoryDefinitionForRecording(
    factoryJson,
    childSlug,
  );
  const sessionId = `session-packaged-${childSlug}`;
  const eventId = `evt-${childSlug}-topology-001`;

  return {
    schemaVersion: FACTORY_RECORDING_SCHEMA_VERSION,
    id: input.id ?? `packaged-${childSlug}-sample`,
    title: input.title ?? `${childSlug} packaged factory sample`,
    summary:
      input.summary ??
      `Distinctive factory-recording/v1 sample for packaged-factories ${childSlug}.`,
    factory: factory as FactoryRecording["factory"],
    events: [
      {
        schemaVersion: "agent-factory.event.v1",
        id: eventId,
        type: "INITIAL_STRUCTURE_REQUEST",
        context: {
          sequence: 1,
          tick: 0,
          eventTime: PACKAGED_FACTORY_RECORDING_EVENT_TIME,
          sessionId,
          sessionSequence: 1,
        },
        payload: {
          factory: factory as NonNullable<FactoryRecording["factory"]>,
        },
      },
    ],
  };
}

/**
 * Validate a recording through the public client parser and project every tick
 * with public factory-replay helpers. Fails closed on parser or topology
 * projection failure; work-progress projection must not throw.
 */
export function validatePackagedFactoryRecordingSample(
  recording: unknown,
  childSlug?: PackagedFactoryRecordingSlug,
): FactoryRecording {
  const safe = safeParseFactoryRecording(recording);
  if (!safe.success) {
    const detail = safe.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new PackagedFactoryRecordingSamplesError(
      "recording-parser-failure",
      `factory-recording/v1 parse failed${childSlug !== undefined ? ` for "${childSlug}"` : ""}: ${detail}`,
      { childSlug, cause: safe.issues },
    );
  }

  let parsed: FactoryRecording;
  try {
    parsed = parseFactoryRecording(recording);
  } catch (error) {
    throw new PackagedFactoryRecordingSamplesError(
      "recording-parser-failure",
      `parseFactoryRecording threw${childSlug !== undefined ? ` for "${childSlug}"` : ""}.`,
      { childSlug, cause: error },
    );
  }

  const ticks = [
    ...new Set(parsed.events.map((event) => event.context.tick)),
  ].sort((a, b) => a - b);

  for (const tick of ticks) {
    let topology: ReturnType<typeof projectFactoryTopologyAtTick>;
    try {
      topology = projectFactoryTopologyAtTick({
        events: parsed.events,
        tick,
      });
    } catch (error) {
      throw new PackagedFactoryRecordingSamplesError(
        "recording-projection-failure",
        `projectFactoryTopologyAtTick threw at tick ${tick}${childSlug !== undefined ? ` for "${childSlug}"` : ""}.`,
        { childSlug, cause: error },
      );
    }
    if (!topology.ok) {
      const detail = topology.issues
        .slice(0, 5)
        .map((issue) => issue.message)
        .join("; ");
      throw new PackagedFactoryRecordingSamplesError(
        "recording-projection-failure",
        `Topology projection failed at tick ${tick}${childSlug !== undefined ? ` for "${childSlug}"` : ""}: ${detail}`,
        { childSlug, cause: topology.issues },
      );
    }

    try {
      projectFactoryWorkProgressAtTick({
        events: parsed.events,
        tick,
      });
    } catch (error) {
      throw new PackagedFactoryRecordingSamplesError(
        "recording-projection-failure",
        `projectFactoryWorkProgressAtTick threw at tick ${tick}${childSlug !== undefined ? ` for "${childSlug}"` : ""}.`,
        { childSlug, cause: error },
      );
    }
  }

  return parsed;
}

/**
 * Build six distinctive validated recording artifacts from an ordered index
 * corpus. Fails closed when a recording slug is missing, parse/project fails,
 * histories are duplicated, or a deep-research recording would be emitted.
 */
export function buildPackagedFactoryRecordingSamples(
  corpus: PackagedFactoryIndexCorpus,
): PackagedFactoryRecordingSampleArtifact[] {
  const bySlug = new Map(
    corpus.entries.map((entry) => [entry.childSlug, entry] as const),
  );

  const artifacts: PackagedFactoryRecordingSampleArtifact[] = [];
  const fingerprints = new Set<string>();

  for (const childSlug of PACKAGED_FACTORY_RECORDING_SLUGS) {
    const entry = bySlug.get(childSlug);
    if (entry === undefined) {
      throw new PackagedFactoryRecordingSamplesError(
        "missing-recording-corpus-entry",
        `Corpus is missing the "${childSlug}" entry required to build a recording sample.`,
        { childSlug },
      );
    }

    let recording: PackagedFactoryRecordingSample;
    try {
      recording = buildPackagedFactoryRecordingSample({
        childSlug,
        factoryJson: entry.factoryJson,
      });
    } catch (error) {
      throw new PackagedFactoryRecordingSamplesError(
        "invalid-recording-factory-projection",
        `Failed to project recording-safe factory topology for "${childSlug}".`,
        { childSlug, cause: error },
      );
    }

    validatePackagedFactoryRecordingSample(recording, childSlug);

    const fingerprint = packagedFactoryRecordingTopologyFingerprint(
      (recording.factory ?? {}) as Record<string, unknown>,
    );
    if (fingerprints.has(fingerprint)) {
      throw new PackagedFactoryRecordingSamplesError(
        "duplicate-recording-history",
        `Recording for "${childSlug}" is not distinctive — its topology identity duplicates another package recording.`,
        { childSlug },
      );
    }
    fingerprints.add(fingerprint);

    artifacts.push({
      childSlug,
      relativePath: packagedFactoryRecordingArtifactPath(childSlug),
      recording,
    });
  }

  if (artifacts.length !== PACKAGED_FACTORY_RECORDING_SLUGS.length) {
    throw new PackagedFactoryRecordingSamplesError(
      "missing-recording-corpus-entry",
      `Expected ${PACKAGED_FACTORY_RECORDING_SLUGS.length} recordings, built ${artifacts.length}.`,
    );
  }

  return artifacts;
}
