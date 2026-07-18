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
  API_PACKAGE_CONSUMED_HASH_LEDGER_FORMAT_VERSION,
  buildApiPackageConsumedHashLedger,
  DEFAULT_API_PACKAGE_CONSUMED_EXPORT_REQUIREMENTS,
  renderApiPackageConsumedHashLedgerModule,
} from "./api-package-consumed-hash-ledger";
import {
  API_PACKAGE_CONSUMED_HASH_LEDGER_GENERATED_FILE_NAME,
  generateApiPackageConsumedHashLedger,
} from "./api-package-consumed-hash-ledger-generation";
import { validateConsumedApiPackageExportFormatVersionsForFamilies } from "./api-package-format-version-gate";
import { loadApiPackageManifest } from "./api-package-manifest-membership";
import { API_PACKAGE_FIXED_PUBLIC_SUBPATHS } from "./api-package-public-exports";

const cleanupPaths: string[] = [];

afterEach(() => {
  for (const path of cleanupPaths.splice(0)) {
    rmSync(path, { force: true, recursive: true });
  }
});

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "api-package-consumed-hash-ledger-"));
  cleanupPaths.push(dir);
  return dir;
}

describe("DEFAULT_API_PACKAGE_CONSUMED_EXPORT_REQUIREMENTS", () => {
  test("covers every fixed public subpath except the manifest authority", () => {
    const expected = API_PACKAGE_FIXED_PUBLIC_SUBPATHS.filter(
      (subpath) => subpath !== "manifest",
    );
    expect(
      DEFAULT_API_PACKAGE_CONSUMED_EXPORT_REQUIREMENTS.map(
        (requirement) => requirement.target,
      ),
    ).toEqual([...expected]);
    expect(
      DEFAULT_API_PACKAGE_CONSUMED_EXPORT_REQUIREMENTS.every((requirement) =>
        requirement.dependentReferenceFamily.endsWith("-reference"),
      ),
    ).toBe(true);
  });
});

describe("buildApiPackageConsumedHashLedger", () => {
  test("records export identity, artifact hash, and package source identity", () => {
    const validated = validateConsumedApiPackageExportFormatVersionsForFamilies(
      [
        { target: "cli", dependentReferenceFamily: "cli-reference" },
        { target: "mcp", dependentReferenceFamily: "mcp-reference" },
      ],
    );
    const manifest = loadApiPackageManifest();
    const ledger = buildApiPackageConsumedHashLedger(validated);

    expect(ledger.formatVersion).toBe(
      API_PACKAGE_CONSUMED_HASH_LEDGER_FORMAT_VERSION,
    );
    expect(ledger.packageId).toBe(manifest.packageId);
    expect(ledger.packageVersion).toBe(manifest.packageVersion);
    expect(ledger.sourceCommit).toBe(manifest.sourceCommit);
    expect(ledger.manifestFormatVersion).toBe(manifest.formatVersion);
    expect(ledger.entries).toHaveLength(2);
    expect(ledger.entries.map((entry) => entry.subpath)).toEqual([
      "cli",
      "mcp",
    ]);
    for (const entry of ledger.entries) {
      expect(entry.specifier).toBe(`@you-agent-factory/api/${entry.subpath}`);
      expect(entry.exportId.length).toBeGreaterThan(0);
      expect(entry.path.startsWith("generated/")).toBe(true);
      expect(entry.family.length).toBeGreaterThan(0);
      expect(entry.artifactHash).toMatch(/^[0-9a-f]{64}$/);
      expect(entry.dependentReferenceFamily).toBe(`${entry.subpath}-reference`);
    }
  });

  test("sorts entries deterministically regardless of input order", () => {
    const validated = validateConsumedApiPackageExportFormatVersionsForFamilies(
      [
        { target: "openapi", dependentReferenceFamily: "openapi-reference" },
        { target: "cli", dependentReferenceFamily: "cli-reference" },
        {
          target: "javascript/runtime",
          dependentReferenceFamily: "javascript-reference",
        },
      ],
    );
    const reversed = [...validated].reverse();
    const forwardLedger = buildApiPackageConsumedHashLedger(validated);
    const reversedLedger = buildApiPackageConsumedHashLedger(reversed);

    expect(reversedLedger).toEqual(forwardLedger);
    expect(forwardLedger.entries.map((entry) => entry.subpath)).toEqual([
      "cli",
      "javascript/runtime",
      "openapi",
    ]);
  });
});

describe("renderApiPackageConsumedHashLedgerModule", () => {
  test("identical ledgers produce identical module bytes", () => {
    const validated = validateConsumedApiPackageExportFormatVersionsForFamilies(
      DEFAULT_API_PACKAGE_CONSUMED_EXPORT_REQUIREMENTS,
    );
    const ledger = buildApiPackageConsumedHashLedger(validated);
    const first = renderApiPackageConsumedHashLedgerModule(ledger);
    const second = renderApiPackageConsumedHashLedgerModule(
      buildApiPackageConsumedHashLedger(validated),
    );

    expect(first).toBe(second);
    expect(first).toContain("AUTO-GENERATED FILE");
    expect(first).toContain("export const apiPackageConsumedHashLedger");
    expect(first).toContain(ledger.packageVersion);
    expect(first).toContain(ledger.sourceCommit);
    for (const entry of ledger.entries) {
      expect(first).toContain(entry.exportId);
      expect(first).toContain(entry.artifactHash);
    }
  });
});

describe("generateApiPackageConsumedHashLedger", () => {
  test("emits a ledger module under generated runtime output", () => {
    const dir = createTempDir();
    const outputPath = join(
      dir,
      "generated",
      API_PACKAGE_CONSUMED_HASH_LEDGER_GENERATED_FILE_NAME,
    );

    const result = generateApiPackageConsumedHashLedger({ outputPath });

    expect(result.changed).toBe(true);
    expect(result.outputPath).toBe(outputPath);
    expect(result.entryCount).toBe(
      DEFAULT_API_PACKAGE_CONSUMED_EXPORT_REQUIREMENTS.length,
    );
    expect(result.ledger.entries).toHaveLength(result.entryCount);
    expect(readFileSync(outputPath, "utf8")).toBe(result.source);
    expect(result.source).toContain("apiPackageConsumedHashLedger");
  });

  test("re-running with unchanged package inputs produces no ledger diff", () => {
    const dir = createTempDir();
    const outputPath = join(
      dir,
      API_PACKAGE_CONSUMED_HASH_LEDGER_GENERATED_FILE_NAME,
    );

    const first = generateApiPackageConsumedHashLedger({ outputPath });
    expect(first.changed).toBe(true);
    const firstBytes = readFileSync(outputPath, "utf8");
    const firstMtimeMs = statSync(outputPath).mtimeMs;

    const second = generateApiPackageConsumedHashLedger({ outputPath });
    expect(second.changed).toBe(false);
    expect(second.source).toBe(firstBytes);
    expect(readFileSync(outputPath, "utf8")).toBe(firstBytes);
    expect(statSync(outputPath).mtimeMs).toBe(firstMtimeMs);

    const third = generateApiPackageConsumedHashLedger({ outputPath });
    expect(third.changed).toBe(false);
    expect(third.source).toBe(first.source);
  });

  test("rewrites when an existing ledger file differs", () => {
    const dir = createTempDir();
    const outputPath = join(
      dir,
      API_PACKAGE_CONSUMED_HASH_LEDGER_GENERATED_FILE_NAME,
    );
    writeFileSync(outputPath, "// stale ledger\n", "utf8");

    const result = generateApiPackageConsumedHashLedger({ outputPath });

    expect(result.changed).toBe(true);
    expect(readFileSync(outputPath, "utf8")).toBe(result.source);
    expect(result.source).not.toContain("stale ledger");
  });
});
