import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  W20_CONTRACT_PROJECTION_REQUIRED_TEST_PATHS,
  W20_CONTRACT_PROJECTION_SUITE_COMMAND,
} from "../src/lib/verify/w20-contract-projection-convergence";

const repoRoot = join(import.meta.dir, "..");

if (W20_CONTRACT_PROJECTION_REQUIRED_TEST_PATHS.length === 0) {
  console.error(
    "W20 contract/projection required suite is empty — refusing to skip.",
  );
  process.exit(1);
}

const catalogResult = spawnSync(
  "bun",
  ["test", "src/lib/verify/w20-contract-projection-convergence.test.ts"],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if ((catalogResult.status ?? 1) !== 0) {
  console.error(
    `W20 contract/projection catalog proof failed. Reproduce with: ${W20_CONTRACT_PROJECTION_SUITE_COMMAND}`,
  );
  process.exit(catalogResult.status ?? 1);
}

const result = spawnSync(
  "bun",
  ["test", ...W20_CONTRACT_PROJECTION_REQUIRED_TEST_PATHS],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if ((result.status ?? 1) !== 0) {
  console.error(
    `W20 focused contract/projection suite failed. Reproduce locally with: ${W20_CONTRACT_PROJECTION_SUITE_COMMAND}`,
  );
}

process.exit(result.status ?? 1);
