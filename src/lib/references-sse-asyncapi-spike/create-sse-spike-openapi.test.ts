import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { createSseSpikeApiPage } from "./create-sse-spike-openapi";
import { resolvePackagedOpenApiAbsolutePath } from "./load-packaged-openapi";
import { SSE_SPIKE_DOCUMENT_ID, SSE_SPIKE_SAFETY } from "./sse-operations";

describe("W02 SSE spike OpenAPI page factory", () => {
  test("binds createOpenAPI input to the packaged artifact without a proxyUrl", () => {
    const openApiAbsolutePath = resolvePackagedOpenApiAbsolutePath();
    const { server, documentId, APIPage } = createSseSpikeApiPage({
      openApiAbsolutePath,
    });

    expect(documentId).toBe(SSE_SPIKE_DOCUMENT_ID);
    expect(typeof APIPage).toBe("function");
    expect(server.options.proxyUrl).toBeUndefined();
    expect(SSE_SPIKE_SAFETY.proxyUrl).toBeUndefined();
    expect(openApiAbsolutePath).toContain("@you-agent-factory/api");
    expect(openApiAbsolutePath.endsWith("openapi.yaml")).toBe(true);
  });

  test("createAPIPage is constructed with playground disabled", () => {
    const { APIPage } = createSseSpikeApiPage();
    expect(typeof APIPage).toBe("function");
    expect(SSE_SPIKE_SAFETY.playgroundEnabled).toBe(false);
    expect(SSE_SPIKE_SAFETY.enablesLiveRequestPlayground).toBe(false);
  });

  test("createOpenAPI loads all three SSE operations outside happy-dom", async () => {
    // happy-dom's URL polyfill breaks fumadocs-openapi's filesystem $ref
    // resolution. Prove the Next/server path with a plain Bun subprocess.
    const proofScript = join(import.meta.dir, "prove-create-openapi-load.ts");
    const proc = Bun.spawn({
      cmd: ["bun", proofScript],
      cwd: join(import.meta.dir, "../../.."),
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    const payload = JSON.parse(stdout.trim()) as {
      ok: boolean;
      operationCount: number;
      proxyUrl: null;
      documentId: string;
    };
    expect(payload).toMatchObject({
      ok: true,
      operationCount: 3,
      proxyUrl: null,
      documentId: SSE_SPIKE_DOCUMENT_ID,
    });
  });
});
