import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  BUILD_CONTRACT_REQUIRED_SUITE_COMMAND,
  BUILD_CONTRACT_REQUIRED_TEST_PATHS,
} from "../src/lib/build/build-contract-required-test-paths";

const repoRoot = join(import.meta.dir, "..");

const prepareResult = spawnSync("bun", ["run", "pretest"], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (prepareResult.status !== 0) {
  process.exit(prepareResult.status ?? 1);
}

const result = spawnSync(
  "bun",
  ["test", "--max-concurrency=1", ...BUILD_CONTRACT_REQUIRED_TEST_PATHS],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if ((result.status ?? 1) !== 0) {
  console.error(
    `build-contract required suite failed. Reproduce locally with: ${BUILD_CONTRACT_REQUIRED_SUITE_COMMAND}`,
  );
}

process.exit(result.status ?? 1);
