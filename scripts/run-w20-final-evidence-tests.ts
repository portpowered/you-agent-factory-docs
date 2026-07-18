import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  W20_FINAL_EVIDENCE_COMMAND_GATES,
  W20_FINAL_EVIDENCE_POST_COMMAND_SUITE_PATHS,
  W20_FINAL_EVIDENCE_REQUIRED_TEST_PATHS,
  W20_FINAL_EVIDENCE_SUITE_COMMAND,
} from "../src/lib/verify/w20-final-evidence-convergence";

const repoRoot = join(import.meta.dir, "..");

if (W20_FINAL_EVIDENCE_REQUIRED_TEST_PATHS.length === 0) {
  console.error(
    "W20 final-evidence required suite is empty — refusing to skip.",
  );
  process.exit(1);
}

const catalogResult = spawnSync(
  "bun",
  ["test", "src/lib/verify/w20-final-evidence-convergence.test.ts"],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if ((catalogResult.status ?? 1) !== 0) {
  console.error(
    `W20 final-evidence catalog proof failed. Reproduce with: ${W20_FINAL_EVIDENCE_SUITE_COMMAND}`,
  );
  process.exit(catalogResult.status ?? 1);
}

for (const gate of W20_FINAL_EVIDENCE_COMMAND_GATES) {
  const result = spawnSync("make", [gate.makeTarget], {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      ...gate.env,
    },
  });

  if ((result.status ?? 1) !== 0) {
    const envHint =
      Object.keys(gate.env).length > 0
        ? `${Object.entries(gate.env)
            .map(([key, value]) => `${key}=${value}`)
            .join(" ")} `
        : "";
    console.error(
      `W20 final-evidence command gate "${gate.makeTarget}" failed. Reproduce locally with: ${envHint}make ${gate.makeTarget}`,
    );
    process.exit(result.status ?? 1);
  }
}

const suiteResult = spawnSync(
  "bun",
  ["test", ...W20_FINAL_EVIDENCE_POST_COMMAND_SUITE_PATHS],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if ((suiteResult.status ?? 1) !== 0) {
  console.error(
    `W20 final-evidence post-command suite failed. Reproduce locally with: ${W20_FINAL_EVIDENCE_SUITE_COMMAND}`,
  );
  console.error(
    "Hint: browser verify requires a trusted out/ — run `make build` first when out/ is missing or stale.",
  );
}

process.exit(suiteResult.status ?? 1);
