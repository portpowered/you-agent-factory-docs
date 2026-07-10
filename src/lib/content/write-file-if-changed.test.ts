import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  writeFileIfChanged,
  writeFileIfChangedSync,
} from "./write-file-if-changed";

const cleanupPaths: string[] = [];

afterEach(() => {
  for (const path of cleanupPaths.splice(0)) {
    rmSync(path, { force: true, recursive: true });
  }
});

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "write-file-if-changed-"));
  cleanupPaths.push(dir);
  return dir;
}

describe("writeFileIfChangedSync", () => {
  test("creates a missing file and reports changed", () => {
    const dir = createTempDir();
    const path = join(dir, "nested", "out.ts");

    const result = writeFileIfChangedSync(path, "export const value = 1;\n");

    expect(result).toEqual({ changed: true, path });
    expect(readFileSync(path, "utf8")).toBe("export const value = 1;\n");
  });

  test("skips rewrite when bytes are identical and preserves mtime", async () => {
    const dir = createTempDir();
    const path = join(dir, "out.ts");
    writeFileSync(path, "export const value = 1;\n", "utf8");
    const before = statSync(path);

    // Ensure mtime resolution can differ on the next write attempt.
    await Bun.sleep(20);
    const result = writeFileIfChangedSync(path, "export const value = 1;\n");
    const after = statSync(path);

    expect(result.changed).toBe(false);
    expect(after.mtimeMs).toBe(before.mtimeMs);
    expect(after.ino).toBe(before.ino);
  });

  test("replaces bytes when content differs and reports changed", async () => {
    const dir = createTempDir();
    const path = join(dir, "out.ts");
    writeFileSync(path, "export const value = 1;\n", "utf8");
    await Bun.sleep(20);

    const result = writeFileIfChangedSync(path, "export const value = 2;\n");

    expect(result.changed).toBe(true);
    expect(readFileSync(path, "utf8")).toBe("export const value = 2;\n");
  });
});

describe("writeFileIfChanged", () => {
  test("async path matches sync semantics for hit and miss", async () => {
    const dir = createTempDir();
    const path = join(dir, "out.ts");

    const created = await writeFileIfChanged(path, "alpha\n");
    expect(created.changed).toBe(true);

    const before = statSync(path);
    await Bun.sleep(20);
    const unchanged = await writeFileIfChanged(path, "alpha\n");
    const afterUnchanged = statSync(path);
    expect(unchanged.changed).toBe(false);
    expect(afterUnchanged.mtimeMs).toBe(before.mtimeMs);

    const replaced = await writeFileIfChanged(path, "beta\n");
    expect(replaced.changed).toBe(true);
    expect(readFileSync(path, "utf8")).toBe("beta\n");
  });
});
