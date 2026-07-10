import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT_ROOT } from "@/lib/content/content-paths";
import {
  clearRegisteredGraphRecords,
  registerGraphRecords,
} from "@/lib/content/graph-registry-runtime";
import { parseGraphRegistryRecords } from "@/lib/content/graph-registry-validation";
import type { GraphRecord } from "@/lib/content/schemas";

const parsedRecordsByContentRoot = new Map<string, GraphRecord[]>();
let graphRegistryParseCount = 0;

function readGraphRecords(contentRoot: string): GraphRecord[] {
  const graphsRoot = join(contentRoot, "registry", "graphs");
  const graphFileNames = readdirSync(graphsRoot)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));

  graphRegistryParseCount += 1;
  return parseGraphRegistryRecords(
    graphFileNames.map((fileName) => ({
      sourcePath: join(graphsRoot, fileName),
      value: JSON.parse(readFileSync(join(graphsRoot, fileName), "utf8")),
    })),
  );
}

/**
 * Sync in-memory graph overrides for a content root.
 *
 * The live `CONTENT_ROOT` reuses the generated graph-registry runtime module
 * (no disk re-parse). Alternate roots parse once per process and reuse the
 * cached records for later page-load consumers in the same prepare/build.
 */
export function syncGraphRegistryForContentRoot(contentRoot: string): void {
  if (contentRoot === CONTENT_ROOT) {
    clearRegisteredGraphRecords();
    return;
  }

  let records = parsedRecordsByContentRoot.get(contentRoot);
  if (!records) {
    records = readGraphRecords(contentRoot);
    parsedRecordsByContentRoot.set(contentRoot, records);
  }

  clearRegisteredGraphRecords();
  registerGraphRecords(records);
}

/** Test helper: drop alternate-root parse memo and parse counter. */
export function resetRootGraphRegistryLoadStateForTests(): void {
  parsedRecordsByContentRoot.clear();
  graphRegistryParseCount = 0;
}

/** Test helper: how many times alternate-root graph JSON was parsed. */
export function getRootGraphRegistryParseCountForTests(): number {
  return graphRegistryParseCount;
}
