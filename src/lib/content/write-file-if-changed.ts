import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type WriteFileIfChangedResult = {
  /** True when the file was created or its bytes were replaced. */
  changed: boolean;
  path: string;
};

function isMissingFileError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

/**
 * Write `contents` to `path` only when the existing file bytes differ
 * (or the file is missing). Identical content leaves the file untouched.
 */
export function writeFileIfChangedSync(
  path: string,
  contents: string,
): WriteFileIfChangedResult {
  let previous: string | undefined;
  try {
    if (existsSync(path)) {
      previous = readFileSync(path, "utf8");
    }
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }

  if (previous === contents) {
    return { changed: false, path };
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, "utf8");
  return { changed: true, path };
}

/**
 * Async counterpart of {@link writeFileIfChangedSync}.
 */
export async function writeFileIfChanged(
  path: string,
  contents: string,
): Promise<WriteFileIfChangedResult> {
  let previous: string | undefined;
  try {
    previous = await readFile(path, "utf8");
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }

  if (previous === contents) {
    return { changed: false, path };
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, "utf8");
  return { changed: true, path };
}
