import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  buildSpikeOperationAnchor,
  collectCollisionFreeOperationAnchors,
  fumadocsHeadingAnchor,
  idToTitle,
  operationDisplayTitle,
} from "./operation-anchors";

describe("W01 OpenAPI spike operation anchors", () => {
  test("idToTitle mirrors fumadocs camelCase splitting", () => {
    expect(idToTitle("submitWorkBySessionId")).toBe(
      "Submit Work By Session Id",
    );
    expect(idToTitle("list-work")).toBe("List work");
  });

  test("operationDisplayTitle prefers summary then operationId title", () => {
    expect(
      operationDisplayTitle({
        method: "get",
        path: "/x",
        summary: "List work for one session",
        operationId: "listWorkBySessionId",
      }),
    ).toBe("List work for one session");
    expect(
      operationDisplayTitle({
        method: "get",
        path: "/x",
        operationId: "listWorkBySessionId",
      }),
    ).toBe("List Work By Session Id");
  });

  test("fumadocsHeadingAnchor slugifies titles for hash navigation", () => {
    expect(fumadocsHeadingAnchor("List work for one session")).toBe(
      "list-work-for-one-session",
    );
  });

  test("buildSpikeOperationAnchor uses operationId as deep-link id", () => {
    const anchor = buildSpikeOperationAnchor({
      method: "get",
      path: "/factory-sessions/{session_id}/work",
      operationId: "listWorkBySessionId",
      summary: "List work for one session",
    });
    expect(anchor.deepLinkId).toBe("listWorkBySessionId");
    expect(anchor.fumadocsHeadingId).toBe("list-work-for-one-session");
  });

  test("collectCollisionFreeOperationAnchors fails on duplicate operationIds", () => {
    expect(() =>
      collectCollisionFreeOperationAnchors([
        {
          method: "get",
          path: "/a",
          operationId: "sameId",
          summary: "Alpha",
        },
        {
          method: "post",
          path: "/b",
          operationId: "sameId",
          summary: "Beta",
        },
      ]),
    ).toThrow(/deep-link \(operationId\) anchor collision/);
  });

  test("collectCollisionFreeOperationAnchors fails on duplicate fumadocs titles", () => {
    expect(() =>
      collectCollisionFreeOperationAnchors([
        {
          method: "get",
          path: "/a",
          operationId: "alphaOp",
          summary: "Same Title",
        },
        {
          method: "post",
          path: "/b",
          operationId: "betaOp",
          summary: "Same Title",
        },
      ]),
    ).toThrow(/fumadocs heading anchor collision/);
  });

  test("packaged OpenAPI projection has collision-free anchors, schemas, and examples", () => {
    const scriptPath = join(
      import.meta.dir,
      "assert-anchors-schemas-examples.ts",
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
      operationCount: number;
      operationsWithResponseSchema: number;
      operationsWithAuthoredMediaExamples: number;
    };
    expect(payload.ok).toBe(true);
    expect(payload.operationCount).toBe(45);
    expect(payload.operationsWithResponseSchema).toBe(44);
    expect(payload.operationsWithAuthoredMediaExamples).toBeGreaterThan(0);
  });
});
