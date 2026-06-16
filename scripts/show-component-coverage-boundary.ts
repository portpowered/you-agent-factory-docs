import { join } from "node:path";
import { formatComponentCoverageBoundaryReport } from "@/lib/component-coverage/boundary";

const repoRoot = join(import.meta.dir, "..");

console.log(formatComponentCoverageBoundaryReport(repoRoot));
