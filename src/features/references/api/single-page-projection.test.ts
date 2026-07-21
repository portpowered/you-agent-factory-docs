import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { resolveApiPackageArtifact } from "@/lib/references/api-package-artifact-resolver";
import {
  countOpenApiOperations,
  countOpenApiPaths,
} from "./count-openapi-operations";
import {
  API_OPENAPI_PACKAGE_EXPORT,
  API_OPENAPI_SCHEMA_ID,
  API_OPENAPI_SOURCE_BASE_DIR,
  loadApiOpenApiArtifact,
} from "./load-openapi-artifact";

describe("W08 production OpenAPI single-page projection", () => {
  test("loads OpenAPI through W03 public-subpath resolution", () => {
    const loaded = loadApiOpenApiArtifact();

    expect(loaded.specifier).toBe("@you-agent-factory/api/openapi");
    expect(loaded.specifier).toBe(API_OPENAPI_PACKAGE_EXPORT);
    expect(loaded.artifact.subpath).toBe("openapi");
    expect(loaded.artifact.specifier).toBe(API_OPENAPI_PACKAGE_EXPORT);
    expect(loaded.artifact.resolvedPath).toContain("@you-agent-factory/api");
    expect(loaded.artifact.resolvedPath.endsWith("openapi.yaml")).toBe(true);
    expect(loaded.artifact.resolvedPath.includes("node_modules")).toBe(true);
    expect(loaded.schemaId).toBe(API_OPENAPI_SCHEMA_ID);
    expect(
      (loaded.document as { openapi?: string }).openapi?.startsWith("3."),
    ).toBe(true);
  });

  test("W03 acquisition rejects package-root and package-internal targets", () => {
    expect(() => resolveApiPackageArtifact("@you-agent-factory/api")).toThrow(
      /package-root/,
    );
    expect(() =>
      resolveApiPackageArtifact("@you-agent-factory/api/generated/openapi"),
    ).toThrow(/package-internal|Illegal/);
  });

  test("live package inventory is asserted dynamically (not a frozen quota)", () => {
    const loaded = loadApiOpenApiArtifact();
    const document = loaded.document as {
      paths?: Record<string, Record<string, unknown>>;
    };
    const operationCount = countOpenApiOperations(document);
    const pathCount = countOpenApiPaths(document);

    expect(operationCount).toBeGreaterThan(0);
    expect(pathCount).toBeGreaterThan(0);
    expect(operationCount).toBeGreaterThanOrEqual(pathCount);

    // Baseline observation from the plan era (45 ops / 41 paths). Keep as a
    // soft check against the live artifact so drift is visible, not as a
    // product quota the projection must invent.
    expect(operationCount).toBe(45);
    expect(pathCount).toBe(41);
  });

  test('per:"file" projects every published operation onto exactly one virtual page', () => {
    // Run outside happy-dom: bun test preload breaks fumadocs-openapi's
    // json-schema-ref-parser via URL polyfills. Plain `bun` keeps Node URL/fs.
    const scriptPath = join(
      import.meta.dir,
      "assert-single-page-projection.ts",
    );
    const result = Bun.spawnSync({
      cmd: ["bun", scriptPath],
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();
    expect(result.exitCode).toBe(0);
    expect(stderr).toBe("");

    const payload = JSON.parse(stdout.trim()) as {
      ok: boolean;
      pageCount: number;
      pagePath: string;
      operationCount: number;
      pathCount: number;
      normalizedOperationCount: number;
      document: string;
      specifier: string;
    };

    const liveCount = countOpenApiOperations(
      loadApiOpenApiArtifact().document as {
        paths?: Record<string, Record<string, unknown>>;
      },
    );

    expect(payload.ok).toBe(true);
    expect(payload.pageCount).toBe(1);
    expect(payload.operationCount).toBe(liveCount);
    expect(payload.normalizedOperationCount).toBe(liveCount);
    expect(payload.pagePath).toContain(API_OPENAPI_SOURCE_BASE_DIR);
    expect(payload.pagePath).toContain(API_OPENAPI_SCHEMA_ID);
    expect(payload.document).toBe(API_OPENAPI_SCHEMA_ID);
    expect(payload.specifier).toBe(API_OPENAPI_PACKAGE_EXPORT);
  });
});
