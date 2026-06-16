import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { listEnforcedComponentSourceFiles } from "@/lib/component-coverage/boundary";
import {
  COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX,
  COMPONENT_COVERAGE_ENFORCEMENT_TEST_IGNORE_PATTERNS,
  evaluateComponentCoverageEnforcement,
  formatComponentCoverageEnforcementFailure,
  formatComponentCoverageEnforcementSuccess,
  parseBunCoverageTable,
} from "@/lib/component-coverage/enforce";
import { getComponentCoverageEnforcementFixtureOutput } from "@/lib/component-coverage/fixtures";

const repoRoot = join(import.meta.dir, "..");

console.log("Running component coverage enforcement.");

const fixtureOutput = getComponentCoverageEnforcementFixtureOutput(
  process.env.COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE,
);

if (fixtureOutput !== undefined) {
  const coverageRows = parseBunCoverageTable(fixtureOutput);
  const enforcedFiles = listEnforcedComponentSourceFiles(repoRoot);
  const evaluation = evaluateComponentCoverageEnforcement(
    coverageRows,
    enforcedFiles,
  );

  if (!evaluation.passed) {
    console.error(`\n${formatComponentCoverageEnforcementFailure(evaluation)}`);
    process.exit(1);
  }

  console.log(`\n${formatComponentCoverageEnforcementSuccess(evaluation)}`);
  process.exit(0);
}

const testArgs = [
  "test",
  "--coverage",
  ...COMPONENT_COVERAGE_ENFORCEMENT_TEST_IGNORE_PATTERNS.flatMap((pattern) => [
    "--path-ignore-patterns",
    pattern,
  ]),
];

const testResult = spawnSync("bun", testArgs, {
  cwd: repoRoot,
  encoding: "utf8",
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

process.stdout.write(testResult.stdout ?? "");
process.stderr.write(testResult.stderr ?? "");

if (testResult.status !== 0) {
  console.error(
    `\n${COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX}: the coverage test run did not pass.`,
  );
  process.exit(testResult.status ?? 1);
}

const output = `${testResult.stdout ?? ""}\n${testResult.stderr ?? ""}`;
const coverageRows = parseBunCoverageTable(output);
const enforcedFiles = listEnforcedComponentSourceFiles(repoRoot);
const evaluation = evaluateComponentCoverageEnforcement(
  coverageRows,
  enforcedFiles,
);

if (!evaluation.passed) {
  console.error(`\n${formatComponentCoverageEnforcementFailure(evaluation)}`);
  process.exit(1);
}

console.log(`\n${formatComponentCoverageEnforcementSuccess(evaluation)}`);
