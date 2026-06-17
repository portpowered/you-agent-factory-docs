import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatComponentCoverageContractLimitations,
  listEnforcedComponentSourceFiles,
} from "@/lib/component-coverage/boundary";
import {
  COMPONENT_COVERAGE_ENFORCEMENT_FAILURE_PREFIX,
  COMPONENT_COVERAGE_ENFORCEMENT_TEST_IGNORE_PATTERNS,
  evaluateComponentCoverageEnforcement,
  formatComponentCoverageEnforcementFailure,
  formatComponentCoverageEnforcementSuccess,
  parseBunCoverageLcov,
} from "@/lib/component-coverage/enforce";
import { getComponentCoverageEnforcementFixture } from "@/lib/component-coverage/fixtures";

const repoRoot = join(import.meta.dir, "..");
const coverageDir = join(repoRoot, "coverage");

console.log("Running component coverage enforcement.");
console.log(`\n${formatComponentCoverageContractLimitations()}\n`);

const enforcedFiles = listEnforcedComponentSourceFiles(repoRoot);
const fixture = getComponentCoverageEnforcementFixture(
  process.env.COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE,
  enforcedFiles,
);

if (fixture !== undefined) {
  const lcovByFile = parseBunCoverageLcov(fixture.lcov);
  const evaluation = evaluateComponentCoverageEnforcement(
    lcovByFile,
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
  "--coverage-reporter=text",
  "--coverage-reporter=lcov",
  "--coverage-dir",
  coverageDir,
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

const lcovPath = join(coverageDir, "lcov.info");
const lcovByFile = parseBunCoverageLcov(readFileSync(lcovPath, "utf8"));
const evaluation = evaluateComponentCoverageEnforcement(
  lcovByFile,
  enforcedFiles,
);

if (!evaluation.passed) {
  console.error(`\n${formatComponentCoverageEnforcementFailure(evaluation)}`);
  process.exit(1);
}

console.log(`\n${formatComponentCoverageEnforcementSuccess(evaluation)}`);
