import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { resolveStaticExportConfigForGate } from "@/lib/validation/gate-fixtures";
import { assertValidStaticExportConfig } from "@/lib/validation/static-export";

const repoRoot = join(import.meta.dir, "..");

function run(command: string, args: string[]): number {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
    stdio: "inherit",
  });

  return result.status ?? 1;
}

assertValidStaticExportConfig(resolveStaticExportConfigForGate());

const buildStatus = run("make", ["build"]);
if (buildStatus !== 0) {
  process.exit(buildStatus);
}

const exportDir = join(repoRoot, "out");
if (!existsSync(exportDir)) {
  console.error("Static export output missing: expected out/ after build");
  process.exit(1);
}

const testStatus = run("bun", ["test", "tests/unit/static-export.test.ts"]);
process.exit(testStatus);
