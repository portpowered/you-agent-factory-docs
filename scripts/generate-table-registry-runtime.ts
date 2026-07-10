import { readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  getGeneratedContentRuntimeRoot,
  getProjectRoot,
  getRegistryCollectionRoot,
} from "@/lib/content/content-paths";
import {
  createTableRegistrySourceEntries,
  renderGeneratedTableRegistryModule,
} from "@/lib/content/table-registry-generation";
import { writeFileIfChanged } from "@/lib/content/write-file-if-changed";

const projectRoot = getProjectRoot();
const tablesRegistryRoot = getRegistryCollectionRoot("tables");
const outputPath = join(
  getGeneratedContentRuntimeRoot(projectRoot),
  "table-registry.generated.ts",
);

async function main(): Promise<void> {
  const fileNames = await readdir(tablesRegistryRoot);
  const entries = createTableRegistrySourceEntries(fileNames);
  const output = renderGeneratedTableRegistryModule(entries);
  const result = await writeFileIfChanged(outputPath, output);
  const relativeOutputPath = outputPath.replace(`${projectRoot}/`, "");
  console.log(
    `${result.changed ? "Generated" : "Verified"} ${relativeOutputPath}.`,
  );
}

await main();
