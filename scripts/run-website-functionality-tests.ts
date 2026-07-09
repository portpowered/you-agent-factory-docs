import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { resolveWebsiteTestParallelWorkers } from "../src/lib/verify/website-test-workers";

const repoRoot = join(import.meta.dir, "..");
/**
 * Keep plain `make test` aligned with the CI matrix default. The website suite
 * contains many heavyweight server-render and search rows that are stable under
 * the serialized worker budget used in CI, but can time out locally when Bun
 * fans them back out across multiple shards by default.
 */
const defaultParallelWorkers = 1;
/** Match bunfig.toml [test] / [test.ci]; explicit CLI flag survives spawned shards. */
const websiteTestTimeoutMs = 900_000;

const excludedPrefixes = [
  "src/lib/verify/",
  "src/lib/governance/",
  "src/tests/build/",
  "src/tests/ci/",
];

/**
 * Atlas / Phase-1 built-HTML assertion suites and opt-in verifier script tests.
 * These require Model Atlas page fixtures or `.next` built routes and belong on
 * `make verify-atlas-*` / `VERIFY_PRODUCTION_INTEGRATION_TESTS=1`, not required
 * `make test` during rewrite foundation.
 */
const excludedAtlasHtmlAssertionSuffixes = [
  "-built-route-convergence.test.tsx",
  "-built-route-convergence.test.ts",
  "-built-app.test.ts",
  "-built-app.test.tsx",
];

const excludedFiles = new Set([
  "src/lib/build/built-app-html-test-utils.test.ts",
  "src/lib/build/ensure-export-search-artifacts.test.ts",
  "src/lib/build/run-static-export-build.test.ts",
  "src/lib/build/turbopack-nft-tracing-warning.test.ts",
  "src/lib/build/validate-links.test.ts",
  "src/lib/build/verify-export-base-path.test.ts",
  "src/lib/build/verify-export-routes.test.ts",
  "src/lib/build/verify-module-built-routes.test.ts",
  "src/lib/docs/component-coverage-gate.test.ts",
  "src/tests/discovery/verify-grouped-query-attention-built-route.test.ts",
  "src/tests/layout/docs-shell-contract.test.tsx",
  "src/tests/layout/docs-sidebar-navigation.test.tsx",
  "src/tests/layout/docs-page-toc.test.tsx",
  "src/tests/layout/docs-page-footer-hover-convergence.test.tsx",
  "src/tests/layout/docs-index-shell.test.tsx",
  "src/tests/layout/site-routes-shell.test.tsx",
]);

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function listTestFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === "out" ||
      entry.name === ".claude" ||
      entry.name === ".playwright-mcp" ||
      entry.name === ".source" ||
      entry.name === ".git"
    ) {
      continue;
    }

    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTestFiles(fullPath));
      continue;
    }

    if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function isExcluded(relativePath: string): boolean {
  return (
    excludedFiles.has(relativePath) ||
    excludedPrefixes.some((prefix) => relativePath.startsWith(prefix)) ||
    excludedAtlasHtmlAssertionSuffixes.some((suffix) =>
      relativePath.endsWith(suffix),
    )
  );
}

function resolveShardWorkers(): number {
  return resolveWebsiteTestParallelWorkers({
    defaultWorkers: defaultParallelWorkers,
  });
}

function runBunTestShard(args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "bun",
      [
        "test",
        "--timeout",
        String(websiteTestTimeoutMs),
        "--preload",
        "./src/tests/a11y/mock-navigation.ts",
        ...args,
      ],
      {
        cwd: repoRoot,
        stdio: "inherit",
        env: process.env,
      },
    );

    child.once("error", reject);
    child.once("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

function distributeAcrossShards(
  files: string[],
  shardCount: number,
): string[][] {
  const shards = Array.from({ length: shardCount }, () => [] as string[]);

  files.forEach((file, index) => {
    shards[index % shardCount]?.push(file);
  });

  return shards.filter((shard) => shard.length > 0);
}

const testFiles = listTestFiles(repoRoot)
  .map((filePath) => normalizePath(relative(repoRoot, filePath)))
  .filter((relativePath) => !isExcluded(relativePath))
  .sort();

if (testFiles.length === 0) {
  console.error("No website functionality test files found.");
  process.exit(1);
}

const shards = distributeAcrossShards(testFiles, resolveShardWorkers());
const statuses = await Promise.all(
  shards.map((shard) => runBunTestShard(shard)),
);
const failingStatus = statuses.find((status) => status !== 0);
if (failingStatus !== undefined) {
  process.exit(failingStatus);
}

process.exit(0);
