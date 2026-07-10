import { describe, expect, test } from "bun:test";
import {
  DEFAULT_STATIC_EXPORT_BUNDLER,
  nextBuildArgsForStaticExportBundler,
  parseStaticExportBundler,
  resolveStaticExportBundler,
  STATIC_EXPORT_BUNDLER_ENV,
} from "@/lib/build/static-export-bundler";

describe("static-export-bundler", () => {
  test("default bundler stays webpack until a full-pass Turbopack adoption", () => {
    expect(DEFAULT_STATIC_EXPORT_BUNDLER).toBe("webpack");
  });

  test("parseStaticExportBundler accepts only supported modes", () => {
    expect(parseStaticExportBundler("webpack")).toBe("webpack");
    expect(parseStaticExportBundler("turbopack")).toBe("turbopack");
    expect(parseStaticExportBundler("esbuild")).toBeNull();
    expect(parseStaticExportBundler(undefined)).toBeNull();
    expect(parseStaticExportBundler("")).toBeNull();
  });

  test("resolveStaticExportBundler falls back to webpack for unset/invalid env", () => {
    expect(resolveStaticExportBundler({})).toBe("webpack");
    expect(
      resolveStaticExportBundler({ [STATIC_EXPORT_BUNDLER_ENV]: "" }),
    ).toBe("webpack");
    expect(
      resolveStaticExportBundler({ [STATIC_EXPORT_BUNDLER_ENV]: "parcel" }),
    ).toBe("webpack");
  });

  test("resolveStaticExportBundler honors STATIC_EXPORT_BUNDLER override", () => {
    expect(
      resolveStaticExportBundler({ [STATIC_EXPORT_BUNDLER_ENV]: "turbopack" }),
    ).toBe("turbopack");
    expect(
      resolveStaticExportBundler({ [STATIC_EXPORT_BUNDLER_ENV]: "webpack" }),
    ).toBe("webpack");
  });

  test("nextBuildArgsForStaticExportBundler pins webpack and leaves Turbopack default", () => {
    expect(nextBuildArgsForStaticExportBundler("webpack")).toEqual([
      "build",
      "--webpack",
    ]);
    expect(nextBuildArgsForStaticExportBundler("turbopack")).toEqual(["build"]);
  });
});
