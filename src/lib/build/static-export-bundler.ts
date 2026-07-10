/**
 * Supported static-export bundler modes for Next.js production export.
 *
 * Default stays webpack until a recorded correctness comparison proves
 * Turbopack is fully compatible with Fumadocs / `output: "export"` for this
 * repo (base-path, search bootstrap, and no whole-project NFT tracing failure).
 * Override for bake-off runs with `STATIC_EXPORT_BUNDLER=turbopack`.
 */

export const STATIC_EXPORT_BUNDLERS = ["webpack", "turbopack"] as const;

export type StaticExportBundler = (typeof STATIC_EXPORT_BUNDLERS)[number];

/** Env override for bake-off / maintainer comparison runs. */
export const STATIC_EXPORT_BUNDLER_ENV = "STATIC_EXPORT_BUNDLER";

/**
 * Supported default for `build:export` / `make build`. Locked to webpack until
 * `decideStaticExportDefaultBundler` adopts Turbopack after a full-pass
 * comparison (see `static-export-bundler-comparison.ts`).
 */
export const DEFAULT_STATIC_EXPORT_BUNDLER: StaticExportBundler = "webpack";

export type BuildModeEnv = Record<string, string | undefined>;

export function parseStaticExportBundler(
  value: string | undefined,
): StaticExportBundler | null {
  if (value === "webpack" || value === "turbopack") {
    return value;
  }
  return null;
}

/**
 * Resolves the bundler for the supported export Next build.
 * Unknown / unset env values fall back to the locked default (webpack).
 */
export function resolveStaticExportBundler(
  env: BuildModeEnv = process.env,
): StaticExportBundler {
  return (
    parseStaticExportBundler(env[STATIC_EXPORT_BUNDLER_ENV]) ??
    DEFAULT_STATIC_EXPORT_BUNDLER
  );
}

/**
 * Next CLI args for a production build under the given bundler.
 * Next.js 16+ defaults to Turbopack; webpack requires an explicit `--webpack`.
 */
export function nextBuildArgsForStaticExportBundler(
  bundler: StaticExportBundler,
): readonly string[] {
  if (bundler === "webpack") {
    return ["build", "--webpack"];
  }
  return ["build"];
}
