import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  computeStaticExportImmutableSnapshotFingerprint,
  ensureStaticExportImmutableSnapshot,
  evaluateStaticExportImmutableSnapshot,
  getStaticExportImmutableSnapshotGenerationCountForTests,
  resetStaticExportImmutableSnapshotStateForTests,
  STATIC_EXPORT_IMMUTABLE_SNAPSHOT_FINGERPRINT_INPUTS,
  STATIC_EXPORT_IMMUTABLE_SNAPSHOT_OUTPUT_PATH,
  STATIC_EXPORT_IMMUTABLE_SNAPSHOT_STORE_RELATIVE_PATH,
  writeStaticExportImmutableSnapshotStore,
} from "./static-export-immutable-snapshot";

const cleanupPaths: string[] = [];

beforeEach(() => {
  resetStaticExportImmutableSnapshotStateForTests();
});

afterEach(() => {
  resetStaticExportImmutableSnapshotStateForTests();
  for (const path of cleanupPaths.splice(0)) {
    rmSync(path, { force: true, recursive: true });
  }
});

function createFixtureWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), "static-export-immutable-snapshot-"));
  cleanupPaths.push(root);

  mkdirSync(join(root, "src/content/docs"), { recursive: true });
  writeFileSync(
    join(root, "src/content/docs/index.mdx"),
    "# Fixture\n",
    "utf8",
  );
  writeFileSync(
    join(root, "source.config.ts"),
    'export default { dir: "src/content/docs" };\n',
    "utf8",
  );
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "scripts/ensure-static-export-immutable-snapshot.ts"),
    "// fixture ensure script\n",
    "utf8",
  );
  mkdirSync(join(root, "src/lib/build"), { recursive: true });
  writeFileSync(
    join(root, "src/lib/build/static-export-immutable-snapshot.ts"),
    "// fixture snapshot module\n",
    "utf8",
  );

  return root;
}

function writeUsableSourceArtifact(cwd: string, body = "export {};\n"): void {
  mkdirSync(join(cwd, ".source"), { recursive: true });
  writeFileSync(
    join(cwd, STATIC_EXPORT_IMMUTABLE_SNAPSHOT_OUTPUT_PATH),
    body,
    "utf8",
  );
}

describe("static-export-immutable-snapshot", () => {
  test("reuses a prior snapshot when fingerprint matches and output is usable", () => {
    const cwd = createFixtureWorkspace();
    writeUsableSourceArtifact(cwd);
    const fingerprint = computeStaticExportImmutableSnapshotFingerprint(cwd);
    writeStaticExportImmutableSnapshotStore(cwd, fingerprint);

    const decision = evaluateStaticExportImmutableSnapshot({ cwd });
    expect(decision).toEqual({
      action: "reuse",
      reason: "cache-hit",
      fingerprint,
    });

    const result = ensureStaticExportImmutableSnapshot({
      cwd,
      runGenerator: () => {
        throw new Error("generator must not run on cache hit");
      },
      log: () => {},
    });
    expect(result.action).toBe("reused");
    expect(result.reason).toBe("cache-hit");
    expect(getStaticExportImmutableSnapshotGenerationCountForTests()).toBe(0);
  });

  test("regenerates when inputs change (fingerprint miss)", () => {
    const cwd = createFixtureWorkspace();
    writeUsableSourceArtifact(cwd);
    writeStaticExportImmutableSnapshotStore(cwd, "stale-fingerprint");

    const decision = evaluateStaticExportImmutableSnapshot({ cwd });
    expect(decision.action).toBe("regenerate");
    expect(decision.reason).toBe("fingerprint-miss");

    let generated = false;
    const result = ensureStaticExportImmutableSnapshot({
      cwd,
      runGenerator: () => {
        generated = true;
        writeUsableSourceArtifact(cwd, "export const regenerated = true;\n");
      },
      log: () => {},
    });
    expect(generated).toBe(true);
    expect(result.action).toBe("regenerated");
    expect(result.reason).toBe("fingerprint-miss");
    expect(getStaticExportImmutableSnapshotGenerationCountForTests()).toBe(1);

    const after = evaluateStaticExportImmutableSnapshot({ cwd });
    expect(after.action).toBe("reuse");
  });

  test("regenerates when snapshot store is missing or corrupt", () => {
    const cwd = createFixtureWorkspace();
    writeUsableSourceArtifact(cwd);

    expect(evaluateStaticExportImmutableSnapshot({ cwd }).reason).toBe(
      "missing-or-corrupt-store",
    );

    mkdirSync(join(cwd, ".source"), { recursive: true });
    writeFileSync(
      join(cwd, STATIC_EXPORT_IMMUTABLE_SNAPSHOT_STORE_RELATIVE_PATH),
      "{not-json",
      "utf8",
    );
    expect(evaluateStaticExportImmutableSnapshot({ cwd }).reason).toBe(
      "missing-or-corrupt-store",
    );
  });

  test("regenerates when output is missing or empty", () => {
    const cwd = createFixtureWorkspace();
    const fingerprint = computeStaticExportImmutableSnapshotFingerprint(cwd);
    writeStaticExportImmutableSnapshotStore(cwd, fingerprint);

    expect(evaluateStaticExportImmutableSnapshot({ cwd }).reason).toBe(
      "missing-output",
    );

    mkdirSync(join(cwd, ".source"), { recursive: true });
    writeFileSync(
      join(cwd, STATIC_EXPORT_IMMUTABLE_SNAPSHOT_OUTPUT_PATH),
      "",
      "utf8",
    );
    expect(evaluateStaticExportImmutableSnapshot({ cwd }).reason).toBe(
      "unusable-output",
    );
  });

  test("force-clean always regenerates even when snapshot is valid", () => {
    const cwd = createFixtureWorkspace();
    writeUsableSourceArtifact(cwd);
    const fingerprint = computeStaticExportImmutableSnapshotFingerprint(cwd);
    writeStaticExportImmutableSnapshotStore(cwd, fingerprint);

    expect(
      evaluateStaticExportImmutableSnapshot({ cwd, forceClean: true }),
    ).toEqual({
      action: "regenerate",
      reason: "force-clean",
      fingerprint,
    });

    const result = ensureStaticExportImmutableSnapshot({
      cwd,
      forceClean: true,
      runGenerator: () => {
        writeUsableSourceArtifact(cwd, "export const forced = true;\n");
      },
      log: () => {},
    });
    expect(result.action).toBe("regenerated");
    expect(result.reason).toBe("force-clean");
  });

  test("declares fingerprint inputs covering docs content and fumadocs config", () => {
    expect(
      STATIC_EXPORT_IMMUTABLE_SNAPSHOT_FINGERPRINT_INPUTS.inputPaths,
    ).toContain("src/content/docs");
    expect(
      STATIC_EXPORT_IMMUTABLE_SNAPSHOT_FINGERPRINT_INPUTS.generatorPaths,
    ).toContain("source.config.ts");
  });
});
