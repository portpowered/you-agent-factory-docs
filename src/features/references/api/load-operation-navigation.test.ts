import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { normalizeOpenApiOperationsFromArtifact } from "@/lib/references/normalize-family-artifacts";
import {
  API_OPENAPI_PACKAGE_EXPORT,
  loadApiOpenApiArtifact,
} from "./load-openapi-artifact";
import { buildApiOperationNavigationFromArtifact } from "./load-operation-navigation";
import {
  buildApiOperationNavModel,
  readOpenApiDocumentTagOrder,
} from "./operation-navigation";

describe("buildApiOperationNavigationFromArtifact", () => {
  test("groups every published operation by live OpenAPI document tags", () => {
    const loaded = loadApiOpenApiArtifact();
    const documentTagOrder = readOpenApiDocumentTagOrder(loaded.document);
    const normalized = normalizeOpenApiOperationsFromArtifact(loaded.document, {
      publicArtifactId: API_OPENAPI_PACKAGE_EXPORT,
    });
    const expected = buildApiOperationNavModel(normalized, documentTagOrder);
    const nav = buildApiOperationNavigationFromArtifact();

    expect(nav.specifier).toBe(API_OPENAPI_PACKAGE_EXPORT);
    expect(nav.documentTagOrder).toEqual(documentTagOrder);
    expect(nav.normalizedOperationCount).toBe(normalized.length);
    expect(nav.model.operationCount).toBe(normalized.length);
    expect(nav.model.groups.map((g) => g.tag)).toEqual(
      expected.groups.map((g) => g.tag),
    );
    expect(nav.model.linkCount).toBe(expected.linkCount);

    const anchors = new Set(normalized.map((op) => op.anchor));
    for (const group of nav.model.groups) {
      for (const item of group.items) {
        expect(anchors.has(item.anchor)).toBe(true);
        const match = normalized.find((op) => op.id === item.id);
        expect(match).toBeDefined();
        expect(match?.method).toBe(item.method);
        expect(match?.path).toBe(item.path);
        expect(match?.tags ?? []).toContain(group.tag);
      }
    }

    expect(nav.model.groups.length).toBeGreaterThan(0);
    expect(documentTagOrder.length).toBeGreaterThan(0);
    for (const tag of documentTagOrder) {
      const used = normalized.some((op) => (op.tags ?? []).includes(tag));
      if (used) {
        expect(nav.model.groups.some((g) => g.tag === tag)).toBe(true);
      }
    }
  });

  test("nav anchors align with per:file projection (subprocess)", () => {
    const scriptPath = join(import.meta.dir, "assert-operation-navigation.ts");
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
      operationCount: number;
      linkCount: number;
      tagGroups: string[];
      documentTagOrder: string[];
      projectionOperationCount: number;
      pageCount: number;
    };

    expect(payload.ok).toBe(true);
    expect(payload.pageCount).toBe(1);
    expect(payload.operationCount).toBe(payload.projectionOperationCount);
    expect(payload.tagGroups.length).toBeGreaterThan(0);
    expect(payload.documentTagOrder.length).toBeGreaterThan(0);
    expect(payload.linkCount).toBe(payload.operationCount);
  });
});
