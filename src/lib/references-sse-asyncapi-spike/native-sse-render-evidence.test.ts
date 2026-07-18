import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { loadPackagedOpenApiArtifact } from "./load-packaged-openapi";
import {
  citeSseMediaTypesFromOpenApi,
  mediaSchemaDoesNotTraverseXEventSchema,
  NATIVE_FUMADOCS_SSE_RENDER,
  observeNativeSseRenderEvidence,
  probeRenderedSpikeHtml,
  SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE,
  SSE_SPIKE_RESPONSE_STATUS,
} from "./native-sse-render-evidence";
import type { OpenApiLike } from "./observe-sse-operations";

function parsePackagedOpenApi(): OpenApiLike {
  const artifact = loadPackagedOpenApiArtifact();
  return Bun.YAML.parse(artifact.rawText) as OpenApiLike;
}

describe("W02 SSE spike — native text/event-stream and x-event-schema evidence", () => {
  test("cites unmodified media-type objects for all three SSE operations", () => {
    const doc = parsePackagedOpenApi();
    const cited = citeSseMediaTypesFromOpenApi(doc);

    expect(cited).toHaveLength(3);
    expect(cited.map((entry) => entry.path)).toEqual([
      "/factory-sessions/{session_id}/events",
      "/factory-sessions/{session_id}/response-events",
      "/events",
    ]);

    for (const entry of cited) {
      expect(entry.method).toBe("get");
      expect(entry.status).toBe(SSE_SPIKE_RESPONSE_STATUS);
      expect(entry.mediaType).toBe(SSE_SPIKE_EVENT_STREAM_MEDIA_TYPE);
      expect(entry.schema).toEqual(
        expect.objectContaining({
          type: "string",
          description: expect.stringContaining("Server-Sent Events"),
        }),
      );
      expect(typeof entry.xEventSchema).toBe("string");
    }

    expect(cited[0]?.xEventSchema).toBe("#/components/schemas/FactoryEvent");
    expect(cited[1]?.xEventSchema).toBe(
      "#/components/schemas/FactoryResponseEvent",
    );
    expect(cited[2]?.xEventSchema).toBe("#/components/schemas/FactoryEvent");
  });

  test("classifies native display as plain string schema and x-event-schema as ignored", () => {
    const doc = parsePackagedOpenApi();
    const evidence = observeNativeSseRenderEvidence(doc);

    expect(NATIVE_FUMADOCS_SSE_RENDER).toEqual({
      renderer: "fumadocs-openapi@10.10.3",
      textEventStreamDisplay: "plain-string-schema",
      xEventSchemaHandling: "ignored",
    });

    for (const entry of evidence) {
      expect(entry.schemaIsPlainString).toBe(true);
      expect(entry.mediaSchemaDoesNotTraverseXEventSchema).toBe(true);
      expect(entry.textEventStreamDisplay).toBe("plain-string-schema");
      expect(entry.xEventSchemaHandling).toBe("ignored");
      expect(
        mediaSchemaDoesNotTraverseXEventSchema(
          entry.schema,
          entry.xEventSchema,
        ),
      ).toBe(true);
    }

    expect(evidence.map((entry) => entry.role)).toEqual([
      "canonical",
      "ephemeral",
      "compatibility-only",
    ]);
    expect(evidence.map((entry) => entry.xEventSchemaRef)).toEqual([
      "#/components/schemas/FactoryEvent",
      "#/components/schemas/FactoryResponseEvent",
      "#/components/schemas/FactoryEvent",
    ]);
  });

  test("HTML probe treats string schema UI without FactoryEvent $ref as ignored", () => {
    const html = [
      'code class="text-xs">text/event-stream</code>',
      '<span class="text-fd-muted-foreground font-mono">string</span>',
      '<span class="text-fd-muted-foreground font-mono">string</span>',
      '<span class="text-fd-muted-foreground font-mono">string</span>',
      "referenced by x-event-schema. Reconnect cursors",
      // Must not appear when the extension is ignored:
      // "#/components/schemas/FactoryEvent"
      // "discriminator"
    ].join("\n");

    const probe = probeRenderedSpikeHtml(html);
    expect(probe.textEventStreamMediaLabelCount).toBe(1);
    expect(probe.responseBodyStringTypeCount).toBe(3);
    expect(probe.factoryEventSchemaRefCount).toBe(0);
    expect(probe.discriminatorTokenCount).toBe(0);
    expect(probe.xEventSchemaProseCount).toBe(1);
    expect(probe.textEventStreamDisplay).toBe("plain-string-schema");
    expect(probe.xEventSchemaHandling).toBe("ignored");
  });

  test("HTML probe detects traversal when FactoryEvent $ref and discriminator appear", () => {
    const html = [
      "text/event-stream",
      "#/components/schemas/FactoryEvent",
      "discriminator",
      'font-mono">object</span>',
    ].join("\n");

    const probe = probeRenderedSpikeHtml(html);
    expect(probe.xEventSchemaHandling).toBe("traversed");
    expect(probe.textEventStreamDisplay).toBe("richer-stream-ui");
  });

  test("processed OpenAPI retains plain string schema and x-event-schema without traversal", async () => {
    const proofScript = join(
      import.meta.dir,
      "prove-native-sse-render-evidence.ts",
    );
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
      operations: Array<{
        path: string;
        schemaIsPlainString: boolean;
        xEventSchema: string;
        mediaSchemaDoesNotTraverseXEventSchema: boolean;
      }>;
      classification: typeof NATIVE_FUMADOCS_SSE_RENDER;
    };

    expect(payload.ok).toBe(true);
    expect(payload.classification).toEqual(NATIVE_FUMADOCS_SSE_RENDER);
    expect(payload.operations).toHaveLength(3);
    for (const operation of payload.operations) {
      expect(operation.schemaIsPlainString).toBe(true);
      expect(operation.mediaSchemaDoesNotTraverseXEventSchema).toBe(true);
      expect(operation.xEventSchema.length).toBeGreaterThan(0);
    }
  });
});
