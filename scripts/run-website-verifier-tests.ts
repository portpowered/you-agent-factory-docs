import { spawn, spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const verifyDir = join(repoRoot, "src/lib/verify");

const prepareResult = spawnSync("bun", ["run", "pretest"], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (prepareResult.status !== 0) {
  process.exit(prepareResult.status ?? 1);
}

/**
 * Website verifier suites remaining after Atlas/Phase-1 verifier deletion.
 * Atlas module-convergence / GQA / rendered-quality / static-export search HTTP
 * patterns were retired with rewrite-delete-atlas-domain.
 *
 * When no website verifier tests remain, exit 0 so `make test-verify-contract`
 * stays green on the empty-shell rewrite path.
 */
const websiteVerifierPatterns: RegExp[] = [];

const toolingVerifierPatterns = [
  /-check-inventory\.test\.ts$/,
  /-closure\.test\.ts$/,
  /-command-path\.test\.ts$/,
  /-domain\.test\.ts$/,
  /-evidence\.test\.ts$/,
  /-orchestrator\.test\.ts$/,
  /-pass\.test\.ts$/,
  /-reporter\.test\.ts$/,
  /-validator\.test\.ts$/,
  /build-source-fingerprint\.test\.ts$/,
  /built-html-convergence-test-helpers\.test\.ts$/,
  /export-integration-probe-lock\.test\.ts$/,
  /export-probe-spawn-guard\.test\.ts$/,
  /http-harness\.test\.ts$/,
  /launch-playwright-browser\.test\.ts$/,
  /production-integration-.*\.test\.ts$/,
  /server-lifecycle\.test\.ts$/,
  /static-export-http-server\.test\.ts$/,
  /static-export-server-lifecycle\.test\.ts$/,
  /verifier-coverage-gate\.test\.ts$/,
  /verify-listen-port-lock\.test\.ts$/,
];

function isWebsiteVerifierTest(fileName: string): boolean {
  return (
    websiteVerifierPatterns.some((pattern) => pattern.test(fileName)) &&
    !toolingVerifierPatterns.some((pattern) => pattern.test(fileName))
  );
}

const testFiles = readdirSync(verifyDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter(isWebsiteVerifierTest)
  .map((fileName) => `src/lib/verify/${fileName}`)
  .sort();

if (testFiles.length === 0) {
  console.log(
    "No website verifier test files remain after Atlas verifier deletion; skipping.",
  );
  process.exit(0);
}

const child = spawn("bun", ["test", ...testFiles], {
  cwd: repoRoot,
  stdio: "inherit",
  env: process.env,
});

child.once("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.once("close", (code) => {
  process.exit(code ?? 1);
});
