import { describe, expect, test } from "bun:test";
import {
  createEmptyStageTimingsMs,
  finalizeProfileTimings,
  formatStageTimingSummary,
  isStaticExportProfilingEnabled,
  measureWallTimeMs,
  PROFILE_STATIC_EXPORT_ENV,
  STATIC_EXPORT_PROFILE_STAGE_COMMANDS,
  STATIC_EXPORT_PROFILE_STAGE_IDS,
} from "./static-export-profile";

describe("static-export-profile", () => {
  test("profiling defaults off for ordinary builds", () => {
    expect(isStaticExportProfilingEnabled({})).toBe(false);
    expect(
      isStaticExportProfilingEnabled({ [PROFILE_STATIC_EXPORT_ENV]: "" }),
    ).toBe(false);
    expect(
      isStaticExportProfilingEnabled({ [PROFILE_STATIC_EXPORT_ENV]: "0" }),
    ).toBe(false);
    expect(
      isStaticExportProfilingEnabled({ [PROFILE_STATIC_EXPORT_ENV]: "true" }),
    ).toBe(false);
  });

  test("profiling enables only with PROFILE_STATIC_EXPORT=1", () => {
    expect(
      isStaticExportProfilingEnabled({ [PROFILE_STATIC_EXPORT_ENV]: "1" }),
    ).toBe(true);
  });

  test("stage command list covers the required timed stages in pipeline order", () => {
    expect(
      STATIC_EXPORT_PROFILE_STAGE_COMMANDS.map((stage) => stage.id),
    ).toEqual([...STATIC_EXPORT_PROFILE_STAGE_IDS]);

    const nextStage = STATIC_EXPORT_PROFILE_STAGE_COMMANDS.find(
      (stage) => stage.id === "nextCompilationStaticRendering",
    );
    expect(nextStage?.env?.NEXT_STATIC_EXPORT).toBe("1");
  });

  test("measureWallTimeMs records injectable clock deltas", () => {
    const readings = [100, 140];
    let index = 0;
    const clock = () => {
      const value = readings[index] ?? readings[readings.length - 1];
      index += 1;
      return value;
    };

    const elapsed = measureWallTimeMs(() => {
      // no-op stage body
    }, clock);

    expect(elapsed).toBe(40);
  });

  test("timing summary includes required stage fields and total wall time", () => {
    const timings = finalizeProfileTimings(
      {
        ...createEmptyStageTimingsMs(),
        contentRuntimePreparation: 11,
        fumadocsGeneration: 22,
        nextCompilationStaticRendering: 33,
        searchIndexEmission: 44,
        fingerprintWriting: 55,
      },
      165,
    );

    const summary = formatStageTimingSummary(timings);

    expect(summary).toContain("static-export-profile");
    expect(summary).toContain("contentRuntimePreparationMs=11");
    expect(summary).toContain("fumadocsGenerationMs=22");
    expect(summary).toContain("nextCompilationStaticRenderingMs=33");
    expect(summary).toContain("searchIndexEmissionMs=44");
    expect(summary).toContain("fingerprintWritingMs=55");
    expect(summary).toContain("totalWallTimeMs=165");
  });
});
