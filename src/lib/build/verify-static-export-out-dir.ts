import { existsSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";

export const STATIC_EXPORT_OUT_DIR = "out";

export type VerifyStaticExportOutDirResult =
  | { ok: true }
  | { ok: false; reason: string };

export function verifyStaticExportOutDir(
  cwd: string = process.cwd(),
  outDir: string = STATIC_EXPORT_OUT_DIR,
): VerifyStaticExportOutDirResult {
  const absolutePath = isAbsolute(outDir) ? outDir : join(cwd, outDir);

  if (!existsSync(absolutePath)) {
    return {
      ok: false,
      reason: `Missing static export directory at ${outDir}/ — static export did not produce GitHub Pages output.`,
    };
  }

  try {
    if (!statSync(absolutePath).isDirectory()) {
      return {
        ok: false,
        reason: `${outDir} exists but is not a directory.`,
      };
    }
  } catch {
    return {
      ok: false,
      reason: `Cannot read static export directory at ${outDir}/.`,
    };
  }

  return { ok: true };
}
