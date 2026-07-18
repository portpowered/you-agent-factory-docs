import { relative } from "node:path";
import { getProjectRoot } from "@/lib/content/content-paths";
import { generateApiPackageConsumedHashLedger } from "@/lib/references/api-package-consumed-hash-ledger-generation";

if (import.meta.main) {
  const projectRoot = getProjectRoot();
  const result = generateApiPackageConsumedHashLedger({ projectRoot });
  const relativeOutputPath = relative(projectRoot, result.outputPath);
  const changeLabel = result.changed ? "updated" : "already current";
  console.log(
    `API package consumed-hash ledger ${changeLabel}: ${relativeOutputPath} (${result.entryCount} exports).`,
  );
}
