/**
 * Story 007 — focused tests for @fumadocs/asyncapi render evaluation and
 * projection information-loss evidence.
 */

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  buildAsyncApiRenderEvidence,
  observeProjectedAsyncApiRenderSurface,
  probeAsyncApiSpikeHtml,
} from "./asyncapi-render-evidence";
import {
  createSseSpikeAsyncApi,
  SSE_SPIKE_ASYNCAPI_PACKAGE,
  SSE_SPIKE_ASYNCAPI_ROUTE,
  SSE_SPIKE_ASYNCAPI_VERSION,
} from "./create-sse-spike-asyncapi";
import { loadPackagedOpenApiArtifact } from "./load-packaged-openapi";
import type { OpenApiLike } from "./observe-sse-operations";
import { projectOpenApiSseToAsyncApi } from "./project-openapi-to-asyncapi";
import {
  PROJECTION_INFORMATION_LOSS_CONCERNS,
  projectionInformationLossCoversRequiredConcerns,
  recordProjectionInformationLoss,
} from "./projection-information-loss";
import { SSE_SPIKE_SAFETY } from "./sse-operations";

function parsePackagedOpenApi(): {
  doc: OpenApiLike & { components?: { schemas?: Record<string, unknown> } };
  sourceText: string;
} {
  const artifact = loadPackagedOpenApiArtifact();
  return {
    doc: Bun.YAML.parse(artifact.rawText) as OpenApiLike & {
      components?: { schemas?: Record<string, unknown> };
    },
    sourceText: artifact.rawText,
  };
}

describe("W02 SSE spike — @fumadocs/asyncapi render + information loss (007)", () => {
  test("createSseSpikeAsyncApi regenerates AsyncAPI from packaged OpenAPI without hand-edit corpus", () => {
    const spike = createSseSpikeAsyncApi();

    expect(spike.packagePin).toEqual({
      name: SSE_SPIKE_ASYNCAPI_PACKAGE,
      version: SSE_SPIKE_ASYNCAPI_VERSION,
      permanentProductionPin: false,
    });
    expect(spike.asyncapi.info["x-generated-from"]).toBe("packaged-openapi");
    expect(spike.asyncapi.info["x-generated-file-notice"]).toContain(
      "Do not hand-edit",
    );
    expect(spike.operations.length).toBe(3);
    expect(
      spike.operations.every((operation) => operation.action === "receive"),
    ).toBe(true);
    expect(SSE_SPIKE_ASYNCAPI_ROUTE).toBe("/spikes/sse-asyncapi");
    expect(SSE_SPIKE_SAFETY.opensLiveFactoryConnection).toBe(false);
  });

  test("projected surface exposes channels, messages, and envelope payload refs", () => {
    const { doc, sourceText } = parsePackagedOpenApi();
    const projection = projectOpenApiSseToAsyncApi(doc, { sourceText });
    const surface = observeProjectedAsyncApiRenderSurface(
      projection.asyncapi,
      projection.selectedStreams,
    );
    const evidence = buildAsyncApiRenderEvidence(
      projection.asyncapi,
      projection.selectedStreams,
    );

    expect(surface.channelIds).toEqual([
      "getEventsBySessionId",
      "getFactoryResponseEventsBySessionId",
      "getEvents",
    ]);
    expect(surface.operationIds).toContain("receive_getEventsBySessionId");
    expect(surface.messageIds).toContain("getEventsBySessionId__FactoryEvent");
    expect(surface.envelopePayloadRefs).toContain(
      "#/components/schemas/FactoryEvent",
    );
    expect(surface.envelopePayloadRefs).toContain(
      "#/components/schemas/FactoryResponseEvent",
    );
    expect(surface.schemaCount).toBeGreaterThan(10);
    expect(evidence.examplesStatus).toBe("absent-not-invented");
    expect(evidence.handEditedGeneratedAsyncApi).toBe(false);
  });

  test("information-loss report covers required HTTP/SSE concerns without inventing AsyncAPI fixes", () => {
    const { doc, sourceText } = parsePackagedOpenApi();
    const projection = projectOpenApiSseToAsyncApi(doc, { sourceText });
    const report = recordProjectionInformationLoss(doc, projection.asyncapi);

    expect(report.generatedAsyncApiHandEdited).toBe(false);
    expect(report.renderer).toBe("@fumadocs/asyncapi");
    expect(projectionInformationLossCoversRequiredConcerns(report)).toBe(true);
    expect(report.items.map((item) => item.concern).sort()).toEqual(
      [...PROJECTION_INFORMATION_LOSS_CONCERNS].sort(),
    );

    const byConcern = Object.fromEntries(
      report.items.map((item) => [item.concern, item]),
    );

    expect(byConcern["reconnect-cursor-precedence"]?.status).toBe("lost");
    expect(byConcern["reconnect-cursor-precedence"]?.ownership).toBe(
      "api-operation-page",
    );
    expect(byConcern["dual-accept"]?.status).toBe("lost");
    expect(byConcern["handshake-response-headers"]?.status).toBe("lost");
    expect(byConcern["retained-history"]?.status).toBe("lost");
    expect(byConcern["stream-generation-invalidation"]?.status).toBe("lost");
    expect(byConcern["compatibility-only-status"]?.status).toBe(
      "partially-preserved",
    );
  });

  test("HTML probe detects role markers and records absent examples without requiring hand-edits", () => {
    const html = [
      '<main data-sse-asyncapi-spike-role="canonical" data-sse-asyncapi-spike-hand-edited="false">',
      "getEventsBySessionId",
      "getFactoryResponseEventsBySessionId",
      "FactoryEvent",
      "FactoryResponseEvent",
      "discriminator",
      "RUN_REQUEST",
      "GENERATED FILE — temporary W02 spike projection",
      "</main>",
    ].join("\n");

    const probe = probeAsyncApiSpikeHtml(html);
    expect(probe.channelMarkersPresent).toBe(true);
    expect(probe.messageMarkersPresent).toBe(true);
    expect(probe.envelopeSchemaTokensPresent).toBe(true);
    expect(probe.generatedFileNoticePresent).toBe(true);
    expect(probe.exampleTokensPresent).toBe(false);
    expect(
      probe.notes.some((note) => note.includes("No message-example UI")),
    ).toBe(true);
  });

  test("createAsyncAPI loads projected document outside happy-dom", async () => {
    const proofScript = join(import.meta.dir, "prove-create-asyncapi-load.ts");
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
      messageCount: number;
      channelCount: number;
      handEdited: false;
      permanentProductionPin: false;
    };
    expect(payload).toMatchObject({
      ok: true,
      operationCount: 3,
      messageCount: 3,
      channelCount: 3,
      handEdited: false,
      permanentProductionPin: false,
    });
  });
});
