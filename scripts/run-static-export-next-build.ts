/**
 * Supported static-export Next build entrypoint: run the resolved bundler
 * export build, then verify the compile graph / `out/` contain no retired
 * Atlas/AI routes.
 *
 * Default bundler is webpack (`STATIC_EXPORT_BUNDLER` unset). Override with
 * `STATIC_EXPORT_BUNDLER=turbopack` for bake-off runs. Keeps
 * `NEXT_STATIC_EXPORT=1` on for the Next invocation and inherits caller env
 * (including `GITHUB_PAGES_BASE_PATH`) for project-site exports.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import {
  nextBuildArgsForStaticExportBundler,
  resolveStaticExportBundler,
} from "@/lib/build/static-export-bundler";

const cwd = process.cwd();
const runNextScript = resolve(import.meta.dir, "run-next.ts");
const verifyScript = resolve(
  import.meta.dir,
  "verify-static-export-legacy-compile-graph.ts",
);

const bundler = resolveStaticExportBundler(process.env);
const nextArgs = nextBuildArgsForStaticExportBundler(bundler);

const buildEnv = {
  ...process.env,
  NEXT_STATIC_EXPORT: "1",
};

const buildResult = spawnSync("bun", [runNextScript, ...nextArgs], {
  cwd,
  env: buildEnv,
  stdio: "inherit",
});

if (typeof buildResult.status === "number" && buildResult.status !== 0) {
  process.exit(buildResult.status);
}
if (buildResult.error) {
  throw buildResult.error;
}
if (buildResult.status === null) {
  process.exit(1);
}

const verifyResult = spawnSync("bun", [verifyScript, "--out", "out"], {
  cwd,
  env: process.env,
  stdio: "inherit",
});

if (typeof verifyResult.status === "number") {
  process.exit(verifyResult.status);
}
if (verifyResult.error) {
  throw verifyResult.error;
}
process.exit(1);
