import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  W20_LINK_ANCHOR_COMMAND_GATES,
  W20_LINK_ANCHOR_REQUIRED_TEST_PATHS,
  W20_LINK_ANCHOR_SUITE_COMMAND,
} from "../src/lib/verify/w20-link-anchor-convergence";

const repoRoot = join(import.meta.dir, "..");

if (W20_LINK_ANCHOR_REQUIRED_TEST_PATHS.length === 0) {
  console.error("W20 link/anchor required suite is empty — refusing to skip.");
  process.exit(1);
}

const catalogResult = spawnSync(
  "bun",
  ["test", "src/lib/verify/w20-link-anchor-convergence.test.ts"],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if ((catalogResult.status ?? 1) !== 0) {
  console.error(
    `W20 link/anchor catalog proof failed. Reproduce with: ${W20_LINK_ANCHOR_SUITE_COMMAND}`,
  );
  process.exit(catalogResult.status ?? 1);
}

for (const gate of W20_LINK_ANCHOR_COMMAND_GATES) {
  const result = spawnSync("make", [gate.makeTarget], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if ((result.status ?? 1) !== 0) {
    console.error(
      `W20 link/anchor command gate "${gate.makeTarget}" failed. Reproduce locally with: make ${gate.makeTarget}`,
    );
    process.exit(result.status ?? 1);
  }
}

const suiteResult = spawnSync(
  "bun",
  ["test", ...W20_LINK_ANCHOR_REQUIRED_TEST_PATHS],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if ((suiteResult.status ?? 1) !== 0) {
  console.error(
    `W20 focused link/anchor suite failed. Reproduce locally with: ${W20_LINK_ANCHOR_SUITE_COMMAND}`,
  );
}

process.exit(suiteResult.status ?? 1);
