/**
 * Pure + live-host drift / fail-closed proofs for the packaged-factories-index
 * generated corpus (story 005).
 *
 * Asserts docs-owned order, unabridged definitions, exact
 * text, six distinctive recordings, source-hash alignment with installed
 * package bytes, and byte-stable committed generated outputs — without scanning
 * React pages, route loaders, CSS, or dependency manifests.
 */
import { describe, expect, test } from "bun:test";
import { getProjectRoot } from "@/lib/content/content-paths";
import { PACKAGED_FACTORIES_ALLOWLIST_SLUGS } from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import { acquirePackagedFactoryIndexCorpus } from "./acquire-index-corpus";
import {
  assertPackagedFactoryGeneratedArtifactsMatch,
  assertPackagedFactorySourceHashesMatch,
  comparePackagedFactoryGeneratedArtifacts,
  comparePackagedFactorySourceHashes,
  PackagedFactoryCorpusDriftError,
} from "./corpus-drift";
import { buildPackagedFactoriesIndexGeneratedBundle } from "./generated-artifacts-model";
import { hashPackagedFactorySourceText } from "./index-corpus-model";
import {
  PACKAGED_FACTORY_RECORDING_SLUGS,
  PackagedFactoryRecordingSamplesError,
  packagedFactoryRecordingTopologyFingerprint,
  validatePackagedFactoryRecordingSample,
} from "./recording-samples-model";
import {
  hashAcquiredPackagedFactorySources,
  verifyCommittedPackagedFactoriesIndex,
} from "./verify-committed-corpus";

describe("packaged factory corpus drift (pure)", () => {
  test("source hash comparison succeeds for identical ordered sets", () => {
    const hashes = [
      { relativePath: "generated/factories/goal/factory.json", sha256: "abc" },
      {
        relativePath:
          "generated/factories/deep-research/factory.json",
        sha256: "def",
      },
    ];
    expect(comparePackagedFactorySourceHashes(hashes, [...hashes])).toEqual({
      ok: true,
    });
    expect(() =>
      assertPackagedFactorySourceHashesMatch(hashes, [...hashes]),
    ).not.toThrow();
  });

  test("fails closed on source hash drift against package bytes", () => {
    const expected = [
      { relativePath: "generated/factories/goal/factory.json", sha256: "aaa" },
    ];
    const actual = [
      { relativePath: "generated/factories/goal/factory.json", sha256: "bbb" },
    ];

    const comparison = comparePackagedFactorySourceHashes(expected, actual);
    expect(comparison.ok).toBe(false);
    if (comparison.ok) {
      throw new Error("expected source-hash-drift");
    }
    expect(comparison.code).toBe("source-hash-drift");
    expect(comparison.relativePath).toBe("generated/factories/goal/factory.json");

    expect(() =>
      assertPackagedFactorySourceHashesMatch(expected, actual),
    ).toThrow(PackagedFactoryCorpusDriftError);

    try {
      assertPackagedFactorySourceHashesMatch(expected, actual);
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryCorpusDriftError);
      if (error instanceof PackagedFactoryCorpusDriftError) {
        expect(error.code).toBe("source-hash-drift");
        expect(error.relativePath).toBe("generated/factories/goal/factory.json");
      }
    }
  });

  test("fails closed when regenerated artifacts diverge from committed outputs", () => {
    const committed = [
      { relativePath: "index.json", contents: '{"ok":true}\n' },
      { relativePath: "manifest.json", contents: '{"v":1}\n' },
    ];
    const regenerated = [
      { relativePath: "index.json", contents: '{"ok":false}\n' },
      { relativePath: "manifest.json", contents: '{"v":1}\n' },
    ];

    const comparison = comparePackagedFactoryGeneratedArtifacts(
      committed,
      regenerated,
    );
    expect(comparison.ok).toBe(false);
    if (comparison.ok) {
      throw new Error("expected generated-artifact-drift");
    }
    expect(comparison.code).toBe("generated-artifact-drift");
    expect(comparison.relativePath).toBe("index.json");

    expect(() =>
      assertPackagedFactoryGeneratedArtifactsMatch(committed, regenerated),
    ).toThrow(PackagedFactoryCorpusDriftError);
  });

  test("fails closed when a committed artifact is missing from regeneration", () => {
    const committed = [
      { relativePath: "index.json", contents: "{}\n" },
      { relativePath: "manifest.json", contents: "{}\n" },
    ];
    const regenerated = [{ relativePath: "index.json", contents: "{}\n" }];

    const comparison = comparePackagedFactoryGeneratedArtifacts(
      committed,
      regenerated,
    );
    expect(comparison.ok).toBe(false);
    if (comparison.ok) {
      throw new Error("expected missing-generated-artifact");
    }
    expect(comparison.code).toBe("missing-generated-artifact");
    expect(comparison.relativePath).toBe("manifest.json");
  });

  test("fails closed on recording parser failure", () => {
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

  test("fails closed on replay projection failure at a tick", () => {
    // Parses as factory-recording/v1 but topology projection fails because the
    // workstation references a worker node that is not present.
    const brokenRecording = {
      schemaVersion: "factory-recording/v1",
      id: "broken-projection-sample",
      title: "broken projection",
      summary:
        "Intentionally broken topology for fail-closed projection proof.",
      factory: {
        name: "goal",
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
            worker: "missing-worker",
            inputs: [{ workType: "goal", state: "init" }],
            outputs: [{ workType: "goal", state: "complete" }],
          },
        ],
      },
      events: [
        {
          schemaVersion: "agent-factory.event.v1",
          id: "evt-broken-001",
          type: "INITIAL_STRUCTURE_REQUEST",
          context: {
            sequence: 1,
            tick: 0,
            eventTime: "2026-07-23T00:00:00.000Z",
            sessionId: "session-broken",
            sessionSequence: 1,
          },
          payload: {
            factory: {
              name: "goal",
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
                  worker: "missing-worker",
                  inputs: [{ workType: "goal", state: "init" }],
                  outputs: [{ workType: "goal", state: "complete" }],
                },
              ],
            },
          },
        },
      ],
    };

    expect(() =>
      validatePackagedFactoryRecordingSample(brokenRecording, "goal"),
    ).toThrow(PackagedFactoryRecordingSamplesError);

    try {
      validatePackagedFactoryRecordingSample(brokenRecording, "goal");
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryRecordingSamplesError);
      if (error instanceof PackagedFactoryRecordingSamplesError) {
        expect(error.code).toBe("recording-projection-failure");
        expect(error.message).toContain("tick 0");
      }
    }
  });
});

describe("packaged factory corpus drift (live host + committed)", () => {
  test("pure corpus asserts order, unabridged defs, and six recordings", () => {
    const acquired = acquirePackagedFactoryIndexCorpus({
      consumerDir: getProjectRoot(),
    });
    const bundle = buildPackagedFactoriesIndexGeneratedBundle(acquired.corpus);

    expect(bundle.index.entries.map((entry) => entry.childSlug)).toEqual([
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
    ]);

    for (const entry of bundle.index.entries) {
      expect(entry.factoryJsonText.length).toBeGreaterThan(0);
      expect(entry.factoryJson).toEqual(JSON.parse(entry.factoryJsonText));
      expect(entry.factoryJsonSha256).toBe(
        hashPackagedFactorySourceText(entry.factoryJsonText),
      );
      const definitionArtifact = bundle.files.find(
        (file) =>
          file.relativePath === `factories/${entry.childSlug}.factory.json`,
      );
      expect(definitionArtifact?.contents).toBe(entry.factoryJsonText);
    }

    // The deep-research companion JavaScript left the package in 0.0.6 and its
    // factory.json references no script, so no companion artifact is emitted.
    expect(
      bundle.files.some(
        (file) => file.relativePath === "deep-research.source.json",
      ),
    ).toBe(false);

    expect(bundle.recordings.map((recording) => recording.childSlug)).toEqual([
      ...PACKAGED_FACTORY_RECORDING_SLUGS,
    ]);
    const fingerprints = new Set(
      bundle.recordings.map((recording) =>
        packagedFactoryRecordingTopologyFingerprint(
          (recording.recording.factory ?? {}) as Record<string, unknown>,
        ),
      ),
    );
    expect(fingerprints.size).toBe(PACKAGED_FACTORY_RECORDING_SLUGS.length);
    expect(
      bundle.files.some((file) =>
        file.relativePath.includes("deep-research.factory-recording"),
      ),
    ).toBe(false);
  });

  test("source hashes match installed packaged-factories file bytes", () => {
    const acquired = acquirePackagedFactoryIndexCorpus({
      consumerDir: getProjectRoot(),
    });
    const bundle = buildPackagedFactoriesIndexGeneratedBundle(acquired.corpus);

    const fromPull = hashAcquiredPackagedFactorySources([
      ...acquired.pull.required.map((file) => ({
        relativePath: file.relativePath,
        text: file.text,
      })),
      ...acquired.pull.optionalPresent.map((file) => ({
        relativePath: file.relativePath,
        text: file.text,
      })),
    ]);

    assertPackagedFactorySourceHashesMatch(
      bundle.manifest.sourceHashes,
      fromPull,
    );
  });

  test("committed generated outputs match live regeneration for the same inputs", () => {
    const result = verifyCommittedPackagedFactoriesIndex({
      consumerDir: getProjectRoot(),
    });

    expect(result.artifactCount).toBeGreaterThan(0);
    // One hash per allowlisted factory.json. The companion JavaScript that
    // added a trailing hash left the package in 0.0.6.
    expect(result.sourceHashCount).toBe(
      PACKAGED_FACTORIES_ALLOWLIST_SLUGS.length,
    );
    expect(
      result.committedRoot.endsWith("packaged-factories-index/generated"),
    ).toBe(true);
  });

  test("verifyCommittedPackagedFactoriesIndex fails closed on injected source hash drift", () => {
    const acquired = acquirePackagedFactoryIndexCorpus({
      consumerDir: getProjectRoot(),
    });
    const bundle = buildPackagedFactoriesIndexGeneratedBundle(acquired.corpus);

    const drifted = bundle.manifest.sourceHashes.map((entry, index) =>
      index === 0
        ? {
            ...entry,
            sha256: "0".repeat(64),
          }
        : entry,
    );

    expect(() =>
      assertPackagedFactorySourceHashesMatch(
        drifted,
        bundle.manifest.sourceHashes,
      ),
    ).toThrow(PackagedFactoryCorpusDriftError);
  });
});
