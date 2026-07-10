import { describe, expect, test } from "bun:test";
import {
  compareStaticExportBundlers,
  shouldAdoptTurbopackAsDefault,
} from "@/lib/build/static-export-bundler-comparison";
import {
  evaluateStaticExportBundlerCorrectness,
  type StaticExportBundlerCorrectnessObservation,
} from "@/lib/build/static-export-bundler-correctness";

function evaluation(
  overrides: Partial<StaticExportBundlerCorrectnessObservation> &
    Pick<StaticExportBundlerCorrectnessObservation, "bundler">,
) {
  return evaluateStaticExportBundlerCorrectness({
    exportCompleted: true,
    buildOutput: "▲ Next.js 16.2.7\n",
    hasExportOutDirectory: true,
    basePathContractOk: true,
    searchBootstrapOk: true,
    ...overrides,
  });
}

describe("compareStaticExportBundlers", () => {
  test("keeps webpack as recommended default when Turbopack fails NFT tracing", () => {
    const comparison = compareStaticExportBundlers({
      webpack: evaluation({
        bundler: "webpack",
        cleanWallTimeMs: 120_000,
      }),
      turbopack: evaluation({
        bundler: "turbopack",
        cleanWallTimeMs: 90_000,
        buildOutput: `⚠ The whole project was traced unintentionally during NFT analysis.
`,
      }),
    });

    expect(comparison.webpackFullyCompatible).toBe(true);
    expect(comparison.turbopackFullyCompatible).toBe(false);
    expect(comparison.correctnessWinner).toBe("webpack");
    expect(comparison.recommendedDefault).toBe("webpack");
    expect(comparison.adoptTurbopackAsDefault).toBe(false);
    expect(shouldAdoptTurbopackAsDefault(comparison)).toBe(false);
    expect(comparison.relativeCleanTiming).toMatchObject({
      available: true,
      fasterBundler: "turbopack",
    });
    expect(comparison.summaryLines).toContain("recommendedDefault=webpack");
    expect(comparison.summaryLines).toContain("fasterCleanBundler=turbopack");
  });

  test("adopts Turbopack as default only when fully compatible", () => {
    const comparison = compareStaticExportBundlers({
      webpack: evaluation({
        bundler: "webpack",
        cleanWallTimeMs: 150_000,
      }),
      turbopack: evaluation({
        bundler: "turbopack",
        cleanWallTimeMs: 100_000,
        buildOutput: "▲ Next.js 16.2.7 (Turbopack)\n",
      }),
    });

    expect(comparison.turbopackFullyCompatible).toBe(true);
    expect(comparison.recommendedDefault).toBe("turbopack");
    expect(comparison.adoptTurbopackAsDefault).toBe(true);
    expect(shouldAdoptTurbopackAsDefault(comparison)).toBe(true);
    expect(comparison.correctnessWinner).toBe("turbopack");
  });

  test("reports missing relative timing without inventing numbers", () => {
    const comparison = compareStaticExportBundlers({
      webpack: evaluation({ bundler: "webpack" }),
      turbopack: evaluation({
        bundler: "turbopack",
        buildOutput: "▲ Next.js 16.2.7 (Turbopack)\n",
      }),
    });

    expect(comparison.relativeCleanTiming).toEqual({
      available: false,
      reason: "clean-wall-time-missing-for-one-or-both-bundlers",
    });
    expect(comparison.summaryLines).toContain(
      "relativeCleanTiming=not-available:clean-wall-time-missing-for-one-or-both-bundlers",
    );
  });

  test("rejects mismatched bundler labels on the comparison input", () => {
    expect(() =>
      compareStaticExportBundlers({
        webpack: evaluation({ bundler: "turbopack" }),
        turbopack: evaluation({ bundler: "turbopack" }),
      }),
    ).toThrow(/expected webpack evaluation/);
  });
});
