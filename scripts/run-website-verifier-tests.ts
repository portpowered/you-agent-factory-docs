import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  VERIFY_CONTRACT_REQUIRED_SUITE_COMMAND,
  VERIFY_CONTRACT_REQUIRED_TEST_PATHS,
} from "../src/lib/verify/verify-contract-required-test-paths";

const repoRoot = join(import.meta.dir, "..");

const prepareResult = spawnSync("bun", ["run", "pretest"], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (prepareResult.status !== 0) {
  process.exit(prepareResult.status ?? 1);
}

/**
 * Required verify-contract suite after Atlas website-verifier deletion.
 * Runs current factory verifier/tooling contracts. An empty path list is a
 * misconfiguration — fail closed instead of an unconditional skip/exit 0.
 * (Widen to `readonly string[]` so the empty check is not erased by a
 * non-empty `as const` tuple type.)
 */
const verifyContractPaths: readonly string[] =
  VERIFY_CONTRACT_REQUIRED_TEST_PATHS;

if (verifyContractPaths.length === 0) {
  console.error(
    "verify-contract required suite is empty/misconfigured: no factory verifier tooling paths are listed.",
  );
  console.error(
    `Reproduce locally with: ${VERIFY_CONTRACT_REQUIRED_SUITE_COMMAND}`,
  );
  process.exit(1);
}

const result = spawnSync(
  "bun",
  ["test", "--max-concurrency=1", ...verifyContractPaths],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  },
);

if ((result.status ?? 1) !== 0) {
  console.error(
    `verify-contract required suite failed. Reproduce locally with: ${VERIFY_CONTRACT_REQUIRED_SUITE_COMMAND}`,
  );
}

process.exit(result.status ?? 1);
