import { resolve } from "node:path";
import {
  collectRetiredProductDocsConsistency,
  formatRetiredProductDocsConsistency,
} from "../src/lib/governance/retired-product-docs-consistency";

type ParsedArgs = {
  repoRoot: string;
};

function parseArgs(argv: readonly string[]): ParsedArgs {
  let repoRoot = resolve(import.meta.dir, "..");

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--repo-root") {
      repoRoot = resolve(argv[index + 1] ?? "");
      index += 1;
    }
  }

  return { repoRoot };
}

const args = parseArgs(process.argv.slice(2));
const result = collectRetiredProductDocsConsistency({
  repoRoot: args.repoRoot,
});

process.stdout.write(formatRetiredProductDocsConsistency(result));

if (!result.ok) {
  process.exit(1);
}
