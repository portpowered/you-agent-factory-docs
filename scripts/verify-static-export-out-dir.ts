import { verifyStaticExportOutDir } from "../src/lib/build/verify-static-export-out-dir";

const outDir = process.argv[2] ?? "out";
const result = verifyStaticExportOutDir(process.cwd(), outDir);

if (!result.ok) {
  console.error(`Static export output verification failed: ${result.reason}`);
  process.exit(1);
}

console.log(`Static export output verified at ${outDir}/`);
