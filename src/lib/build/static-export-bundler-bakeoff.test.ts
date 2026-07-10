import { describe, expect, test } from "bun:test";
import { DEFAULT_STATIC_EXPORT_BUNDLER } from "@/lib/build/static-export-bundler";
import {
  RECORDED_STATIC_EXPORT_BUNDLER_BAKEOFF,
  recordedStaticExportBundlerComparison,
  resolveLockedStaticExportDefaultBundler,
} from "@/lib/build/static-export-bundler-bakeoff";

describe("static-export-bundler-bakeoff", () => {
  test("recorded comparison keeps webpack as the locked default", () => {
    const comparison = recordedStaticExportBundlerComparison();

    expect(RECORDED_STATIC_EXPORT_BUNDLER_BAKEOFF.webpack.fullyCompatible).toBe(
      true,
    );
    expect(
      RECORDED_STATIC_EXPORT_BUNDLER_BAKEOFF.turbopack.fullyCompatible,
    ).toBe(false);
    expect(comparison.correctnessWinner).toBe("webpack");
    expect(comparison.recommendedDefault).toBe("webpack");
    expect(comparison.adoptTurbopackAsDefault).toBe(false);
    expect(resolveLockedStaticExportDefaultBundler()).toBe(
      DEFAULT_STATIC_EXPORT_BUNDLER,
    );
    expect(resolveLockedStaticExportDefaultBundler()).toBe("webpack");
  });

  test("recorded Turbopack failure is export-incomplete (worktree root resolve)", () => {
    const exportCheck =
      RECORDED_STATIC_EXPORT_BUNDLER_BAKEOFF.turbopack.checks.find(
        (check) => check.id === "exportCompletes",
      );
    expect(exportCheck?.status).toBe("fail");
    expect(
      RECORDED_STATIC_EXPORT_BUNDLER_BAKEOFF.turbopack.checks.find(
        (check) => check.id === "turbopackNftTracing",
      )?.status,
    ).toBe("pass");
  });
});
