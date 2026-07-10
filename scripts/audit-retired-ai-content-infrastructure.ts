import { resolve } from "node:path";
import {
  collectRetiredAiContentInfrastructureDenylist,
  formatRetiredAiContentInfrastructureDenylist,
} from "../src/lib/governance/retired-ai-content-infrastructure-denylist";

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
const result = collectRetiredAiContentInfrastructureDenylist({
  repoRoot: args.repoRoot,
});

process.stdout.write(formatRetiredAiContentInfrastructureDenylist(result));

if (!result.ok) {
  process.exit(1);
}
