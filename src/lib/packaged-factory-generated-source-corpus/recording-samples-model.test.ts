import { describe, expect, test } from "bun:test";
import {
  parseFactoryRecording,
  safeParseFactoryRecording,
} from "@you-agent-factory/client";
import {
  projectFactoryTopologyAtTick,
  projectFactoryWorkProgressAtTick,
} from "@you-agent-factory/factory-replay";
import { getProjectRoot } from "@/lib/content/content-paths";
import { acquirePackagedFactoryIndexCorpus } from "./acquire-index-corpus";
import {
  buildPackagedFactoryRecordingSample,
  buildPackagedFactoryRecordingSamples,
  FACTORY_RECORDING_SCHEMA_VERSION,
  PACKAGED_FACTORY_RECORDING_SLUGS,
  PackagedFactoryRecordingSamplesError,
  packagedFactoryRecordingArtifactPath,
  packagedFactoryRecordingTopologyFingerprint,
  projectPackagedFactoryDefinitionForRecording,
  validatePackagedFactoryRecordingSample,
} from "./recording-samples-model";

describe("packaged factory recording samples (pure)", () => {
  test("projects recording-safe topology using child slug as factory name", () => {
    const projected = projectPackagedFactoryDefinitionForRecording(
      {
        name: "@you/goal",
        workers: [
          {
            name: "goal-executor",
            type: "AGENT_WORKER",
            promptFile: "prompts/executor.md",
            stopToken: "<COMPLETE>",
          },
        ],
        workTypes: [
          {
            name: "goal",
            states: [
              { name: "init", type: "INITIAL" },
              { name: "complete", type: "TERMINAL" },
            ],
          },
        ],
        workstations: [
          {
            name: "execute-goal",
            worker: "goal-executor",
            inputs: [{ workType: "goal", state: "init" }],
            outputs: [{ workType: "goal", state: "complete" }],
          },
        ],
      },
      "goal",
    );

    expect(projected.name).toBe("goal");
    expect(projected.workers).toEqual([
      {
        name: "goal-executor",
        type: "AGENT_WORKER",
        stopToken: "<COMPLETE>",
      },
    ]);
    expect(JSON.stringify(projected)).not.toContain("promptFile");
    expect(projected.workTypes).toEqual([
      {
        name: "goal",
        states: [
          { name: "init", type: "INITIAL" },
          { name: "complete", type: "TERMINAL" },
        ],
      },
    ]);
  });

  test("builds a parseable INITIAL_STRUCTURE_REQUEST recording sample", () => {
    const recording = buildPackagedFactoryRecordingSample({
      childSlug: "goal",
      factoryJson: {
        name: "@you/goal",
        workers: [
          {
            name: "goal-executor",
            type: "AGENT_WORKER",
            promptFile: "prompts/executor.md",
            stopToken: "<COMPLETE>",
          },
        ],
        workTypes: [
          {
            name: "goal",
            states: [
              { name: "init", type: "INITIAL" },
              { name: "complete", type: "TERMINAL" },
            ],
          },
        ],
        workstations: [
          {
            name: "execute-goal",
            worker: "goal-executor",
            inputs: [{ workType: "goal", state: "init" }],
            outputs: [{ workType: "goal", state: "complete" }],
          },
        ],
      },
    });

    expect(recording.schemaVersion).toBe(FACTORY_RECORDING_SCHEMA_VERSION);
    expect(recording.events).toHaveLength(1);
    expect(recording.events[0]?.type).toBe("INITIAL_STRUCTURE_REQUEST");

    const safe = safeParseFactoryRecording(recording);
    expect(safe.success).toBe(true);
    expect(parseFactoryRecording(recording).id).toBe("packaged-goal-sample");
    expect(validatePackagedFactoryRecordingSample(recording, "goal").id).toBe(
      "packaged-goal-sample",
    );
  });

  test("fails closed when recording parser rejects invalid input", () => {
    expect(() =>
      validatePackagedFactoryRecordingSample(
        { schemaVersion: "not-a-recording", events: [] },
        "goal",
      ),
    ).toThrow(PackagedFactoryRecordingSamplesError);

    try {
      validatePackagedFactoryRecordingSample(
        { schemaVersion: "not-a-recording", events: [] },
        "goal",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryRecordingSamplesError);
      if (error instanceof PackagedFactoryRecordingSamplesError) {
        expect(error.code).toBe("recording-parser-failure");
      }
    }
  });

  test("recording artifact paths match the six standard filenames", () => {
    expect(
      PACKAGED_FACTORY_RECORDING_SLUGS.map((slug) =>
        packagedFactoryRecordingArtifactPath(slug),
      ),
    ).toEqual([
      "goal.factory-recording.v1.json",
      "subagent.factory-recording.v1.json",
      "fusion.factory-recording.v1.json",
      "review.factory-recording.v1.json",
      "quorum.factory-recording.v1.json",
      "tts.factory-recording.v1.json",
    ]);
  });
});

describe("packaged factory recording samples (live host corpus)", () => {
  test("builds six distinctive validated recordings and excludes deep-research", () => {
    const acquired = acquirePackagedFactoryIndexCorpus({
      consumerDir: getProjectRoot(),
    });
    const artifacts = buildPackagedFactoryRecordingSamples(acquired.corpus);

    expect(artifacts.map((artifact) => artifact.childSlug)).toEqual([
      ...PACKAGED_FACTORY_RECORDING_SLUGS,
    ]);
    expect(
      artifacts.some((artifact) =>
        artifact.relativePath.includes("deep-research"),
      ),
    ).toBe(false);

    const fingerprints = new Set<string>();
    for (const artifact of artifacts) {
      expect(artifact.relativePath).toBe(
        packagedFactoryRecordingArtifactPath(artifact.childSlug),
      );
      expect(artifact.recording.schemaVersion).toBe(
        FACTORY_RECORDING_SCHEMA_VERSION,
      );
      expect(artifact.recording.factory?.name).toBe(artifact.childSlug);

      const parsed = parseFactoryRecording(artifact.recording);
      const ticks = [
        ...new Set(parsed.events.map((event) => event.context.tick)),
      ].sort((a, b) => a - b);
      expect(ticks.length).toBeGreaterThan(0);

      for (const tick of ticks) {
        const topology = projectFactoryTopologyAtTick({
          events: parsed.events,
          tick,
        });
        expect(topology.ok).toBe(true);
        const progress = projectFactoryWorkProgressAtTick({
          events: parsed.events,
          tick,
        });
        expect(progress.selectedTick).toBe(tick);
      }

      const fingerprint = packagedFactoryRecordingTopologyFingerprint(
        (artifact.recording.factory ?? {}) as Record<string, unknown>,
      );
      expect(fingerprints.has(fingerprint)).toBe(false);
      fingerprints.add(fingerprint);
    }

    expect(fingerprints.size).toBe(PACKAGED_FACTORY_RECORDING_SLUGS.length);
  });

  test("fails closed when a required recording corpus entry is missing", () => {
    const acquired = acquirePackagedFactoryIndexCorpus({
      consumerDir: getProjectRoot(),
    });
    const withoutGoal = {
      ...acquired.corpus,
      entries: acquired.corpus.entries.filter(
        (entry) => entry.childSlug !== "goal",
      ),
    };

    expect(() => buildPackagedFactoryRecordingSamples(withoutGoal)).toThrow(
      PackagedFactoryRecordingSamplesError,
    );

    try {
      buildPackagedFactoryRecordingSamples(withoutGoal);
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryRecordingSamplesError);
      if (error instanceof PackagedFactoryRecordingSamplesError) {
        expect(error.code).toBe("missing-recording-corpus-entry");
        expect(error.childSlug).toBe("goal");
      }
    }
  });
});
