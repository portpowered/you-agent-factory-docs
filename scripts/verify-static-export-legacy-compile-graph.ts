/**
 * Verifies the supported static-export compile graph has no retired Atlas/AI
 * route modules, owned paths, or emitted HTML under retired public families.
 *
 * Usage:
 *   bun ./scripts/verify-static-export-legacy-compile-graph.ts
 *   bun ./scripts/verify-static-export-legacy-compile-graph.ts --out out
 *   bun ./scripts/verify-static-export-legacy-compile-graph.ts --repo-root /path
 */
import { resolve } from "node:path";
import { DEFAULT_EXPORT_OUT_DIR } from "../src/lib/build/export-out-directory";
import {
  auditStaticExportLegacyCompileGraph,
  formatLegacyCompileGraphAudit,
} from "../src/lib/build/static-export-legacy-compile-graph";

type ParsedArgs = {
  repoRoot: string;
  outDir: string;
};

function parseArgs(argv: readonly string[]): ParsedArgs {
  let repoRoot = resolve(import.meta.dir, "..");
  let outDir = DEFAULT_EXPORT_OUT_DIR;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") {
      repoRoot = resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (arg === "--out") {
      outDir = argv[index + 1] ?? DEFAULT_EXPORT_OUT_DIR;
      index += 1;
    }
  }

  return { repoRoot, outDir };
}

const args = parseArgs(process.argv.slice(2));
const result = auditStaticExportLegacyCompileGraph({
  projectRoot: args.repoRoot,
  outDir: args.outDir,
});

process.stdout.write(`${formatLegacyCompileGraphAudit(result)}\n`);

if (!result.ok) {
  process.exit(1);
}
