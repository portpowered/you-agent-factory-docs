import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { resolveShellAccessibilitySnapshotForGate } from "@/lib/validation/gate-fixtures";
import {
  FOCUSED_SHELL_ACCESSIBILITY_COVERAGE,
  assertValidShellAccessibilitySnapshot,
} from "@/lib/validation/shell-accessibility";

const repoRoot = join(import.meta.dir, "..");

const fixtureSnapshot = resolveShellAccessibilitySnapshotForGate();
if (fixtureSnapshot) {
  assertValidShellAccessibilitySnapshot(fixtureSnapshot);
  console.log("Shell accessibility validation passed");
  process.exit(0);
}

console.log(
  `Focused shell accessibility coverage:\n${FOCUSED_SHELL_ACCESSIBILITY_COVERAGE.map((item) => `- ${item}`).join("\n")}`,
);

const testStatus = spawnSync(
  "bun",
  [
    "test",
    "tests/unit/homepage-shell.test.tsx",
    "tests/unit/docs-shell.test.tsx",
    "tests/unit/shell-accessibility-validation.test.tsx",
  ],
  {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
    stdio: "inherit",
  },
).status;

process.exit(testStatus ?? 1);
