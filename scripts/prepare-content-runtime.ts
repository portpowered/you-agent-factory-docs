import { join } from "node:path";
import {
  resolveContentRuntimeForceClean,
  runContentRuntimePreparation,
} from "../src/lib/content/content-runtime-preparation";

const repoRoot = join(import.meta.dir, "..");
const forceClean = resolveContentRuntimeForceClean(
  process.env,
  process.argv.slice(2),
);
const result = runContentRuntimePreparation({
  cwd: repoRoot,
  forceClean,
});

if (!result.ok) {
  process.exit(result.commandResult.status ?? 1);
}
