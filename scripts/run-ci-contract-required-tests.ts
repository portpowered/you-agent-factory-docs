import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  CI_CONTRACT_REQUIRED_SUITE_COMMAND,
  CI_CONTRACT_REQUIRED_TEST_PATHS,
} from "../src/lib/ci-contract-required-test-paths";

const repoRoot = join(import.meta.dir, "..");

const prepareResult = spawnSync("bun", ["run", "pretest"], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (prepareResult.status !== 0) {
  process.exit(prepareResult.status ?? 1);
}

const ciContractPaths: readonly string[] = CI_CONTRACT_REQUIRED_TEST_PATHS;

if (ciContractPaths.length === 0) {
  console.error(
    "ci-contract required suite is empty/misconfigured: no CI alignment paths are listed.",
  );
  console.error(
    `Reproduce locally with: ${CI_CONTRACT_REQUIRED_SUITE_COMMAND}`,
  );
  process.exit(1);
}

const result = spawnSync(
  "bun",
  ["test", "--max-concurrency=1", ...ciContractPaths],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if ((result.status ?? 1) !== 0) {
  console.error(
    `ci-contract required suite failed. Reproduce locally with: ${CI_CONTRACT_REQUIRED_SUITE_COMMAND}`,
  );
}

process.exit(result.status ?? 1);
