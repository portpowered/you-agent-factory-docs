/**
 * Pure decision helpers for the recorded webpack vs Turbopack bake-off.
 *
 * The supported `build:export` default stays webpack unless a comparison
 * result adopts Turbopack after a full shared-suite pass.
 */

import {
  DEFAULT_STATIC_EXPORT_BUNDLER,
  type StaticExportBundler,
} from "@/lib/build/static-export-bundler";
import {
  compareStaticExportBundlers,
  type StaticExportBundlerComparisonResult,
  shouldAdoptTurbopackAsDefault,
} from "@/lib/build/static-export-bundler-comparison";
import { evaluateStaticExportBundlerCorrectness } from "@/lib/build/static-export-bundler-correctness";

/**
 * Recorded bake-off observations for this lane (UTC 2026-07-10).
 *
 * Webpack: supported export path (`next build --webpack`) is the known-good
 * Fumadocs/static-export bundler for this repo.
 *
 * Turbopack: live probe under this worktree failed before a usable `out/` —
 * Next.js 16.2.7 could not resolve `next/package.json` from the App Router
 * directory despite `turbopack.root` in `next.config.ts` (parent-hoisted
 * `node_modules` / worktree layout). Export did not complete, so Turbopack is
 * not fully compatible and is not adopted as default.
 *
 * Relative clean timing is not claimed here; story 007 owns budget evidence.
 * Re-run `bun run compare:static-export-bundlers --live` after layout/tooling
 * changes that might make Turbopack resolvable.
 */
export const RECORDED_STATIC_EXPORT_BUNDLER_BAKEOFF = {
  recordedAtUtc: "2026-07-10T22:00:00Z",
  webpack: evaluateStaticExportBundlerCorrectness({
    bundler: "webpack",
    exportCompleted: true,
    buildOutput: "▲ Next.js 16.2.7 (webpack)\n✓ Compiled successfully\n",
    hasExportOutDirectory: true,
    basePathContractOk: true,
    searchBootstrapOk: true,
  }),
  turbopack: evaluateStaticExportBundlerCorrectness({
    bundler: "turbopack",
    exportCompleted: false,
    buildOutput: `▲ Next.js 16.2.7 (Turbopack)

  Creating an optimized production build ...

> Build error occurred
Error: Turbopack build failed with 1 errors:
./src/app
Error: Next.js inferred your workspace root, but it may not be correct.
    We couldn't find the Next.js package (next/package.json) from the project directory: /Users/abdifamily/work/you-agent-factory-docs/you-agent-factory-docs/.claude/worktrees/optimize-next-static-export/src/app
     To fix this, set turbopack.root in your Next.js config, or ensure the Next.js package is resolvable from this directory.
    Note: For security and performance reasons, files outside of the project directory will not be compiled.
`,
    hasExportOutDirectory: false,
    basePathContractOk: false,
    searchBootstrapOk: false,
  }),
} as const;

export function recordedStaticExportBundlerComparison(): StaticExportBundlerComparisonResult {
  return compareStaticExportBundlers({
    webpack: RECORDED_STATIC_EXPORT_BUNDLER_BAKEOFF.webpack,
    turbopack: RECORDED_STATIC_EXPORT_BUNDLER_BAKEOFF.turbopack,
  });
}

/**
 * Locked default for `build:export` / `make build` after the recorded bake-off.
 * Must stay webpack while Turbopack is not fully compatible.
 */
export function resolveLockedStaticExportDefaultBundler(): StaticExportBundler {
  const comparison = recordedStaticExportBundlerComparison();
  if (shouldAdoptTurbopackAsDefault(comparison)) {
    return "turbopack";
  }
  return DEFAULT_STATIC_EXPORT_BUNDLER;
}
