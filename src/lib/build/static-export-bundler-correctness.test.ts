import { describe, expect, test } from "bun:test";
import {
  evaluateStaticExportBundlerCorrectness,
  type StaticExportBundlerCorrectnessObservation,
} from "@/lib/build/static-export-bundler-correctness";

function observation(
  overrides: Partial<StaticExportBundlerCorrectnessObservation> &
    Pick<StaticExportBundlerCorrectnessObservation, "bundler">,
): StaticExportBundlerCorrectnessObservation {
  return {
    exportCompleted: true,
    buildOutput: "▲ Next.js 16.2.7\n",
    hasExportOutDirectory: true,
    basePathContractOk: true,
    searchBootstrapOk: true,
    ...overrides,
  };
}

describe("evaluateStaticExportBundlerCorrectness", () => {
  test("marks a complete webpack export as fully compatible", () => {
    const evaluation = evaluateStaticExportBundlerCorrectness(
      observation({ bundler: "webpack" }),
    );

    expect(evaluation.fullyCompatible).toBe(true);
    expect(
      evaluation.checks.find((c) => c.id === "turbopackNftTracing"),
    ).toEqual({
      id: "turbopackNftTracing",
      status: "not-applicable",
      reason: "webpack-bundler",
    });
  });

  test("fails when export does not complete", () => {
    const evaluation = evaluateStaticExportBundlerCorrectness(
      observation({
        bundler: "webpack",
        exportCompleted: false,
        hasExportOutDirectory: false,
        basePathContractOk: false,
        searchBootstrapOk: false,
      }),
    );

    expect(evaluation.fullyCompatible).toBe(false);
    expect(
      evaluation.checks.find((c) => c.id === "exportCompletes")?.status,
    ).toBe("fail");
  });

  test("fails Turbopack when whole-project NFT tracing warning appears", () => {
    const evaluation = evaluateStaticExportBundlerCorrectness(
      observation({
        bundler: "turbopack",
        buildOutput: `▲ Next.js 16.2.7 (Turbopack)
⚠ Encountered unexpected file in NFT list: ./next.config.ts
`,
      }),
    );

    expect(evaluation.fullyCompatible).toBe(false);
    expect(
      evaluation.checks.find((c) => c.id === "turbopackNftTracing"),
    ).toMatchObject({
      status: "fail",
      reason: "turbopack-whole-project-nft-tracing-warning",
    });
  });

  test("passes Turbopack when export contracts hold and NFT warning is absent", () => {
    const evaluation = evaluateStaticExportBundlerCorrectness(
      observation({
        bundler: "turbopack",
        buildOutput: "▲ Next.js 16.2.7 (Turbopack)\n✓ Compiled successfully\n",
      }),
    );

    expect(evaluation.fullyCompatible).toBe(true);
    expect(
      evaluation.checks.find((c) => c.id === "turbopackNftTracing")?.status,
    ).toBe("pass");
  });

  test("fails base-path or search-bootstrap independently", () => {
    const basePathFail = evaluateStaticExportBundlerCorrectness(
      observation({
        bundler: "webpack",
        basePathContractOk: false,
      }),
    );
    const searchFail = evaluateStaticExportBundlerCorrectness(
      observation({
        bundler: "webpack",
        searchBootstrapOk: false,
      }),
    );

    expect(basePathFail.fullyCompatible).toBe(false);
    expect(
      basePathFail.checks.find((c) => c.id === "buildContractBasePath")?.status,
    ).toBe("fail");
    expect(searchFail.fullyCompatible).toBe(false);
    expect(
      searchFail.checks.find((c) => c.id === "searchBootstrap")?.status,
    ).toBe("fail");
  });
});
