import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { resolveStaticExportConfigForGate } from "@/lib/validation/gate-fixtures";
import {
  STATIC_EXPORT_SKIP_BUILD_ENV,
  assertValidStaticExportConfig,
} from "@/lib/validation/static-export";

const repoRoot = join(import.meta.dir, "..");
const nextDir = join(repoRoot, ".next");

function run(
  command: string,
  args: string[],
  options?: { env?: NodeJS.ProcessEnv },
): number {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...options?.env,
    },
    stdio: "inherit",
  });

  return result.status ?? 1;
}

assertValidStaticExportConfig(resolveStaticExportConfigForGate());

rmSync(nextDir, { recursive: true, force: true });

const buildStatus = run("bun", ["run", "build"]);
if (buildStatus !== 0) {
  process.exit(buildStatus);
}

const exportDir = join(repoRoot, "out");
if (!existsSync(exportDir)) {
  console.error("Static export output missing: expected out/ after build");
  process.exit(1);
}

const testStatus = run("bun", ["test", "tests/unit/static-export.test.ts"], {
  env: {
    ...process.env,
    [STATIC_EXPORT_SKIP_BUILD_ENV]: "1",
  },
});
process.exit(testStatus);
