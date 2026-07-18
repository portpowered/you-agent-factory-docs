/**
 * Static SSE frame + reconnect examples for the W09 events corpus.
 *
 * OpenAPI 3.0.3 cannot structurally declare SSE `id:` / `event:` / `data:`
 * frames, so wire-shape examples are clearly labeled illustrative/static
 * fixtures. Reconnect request/header names and JSON probe recovery shapes are
 * aligned with the live reconnect-lifecycle corpus / authored OpenAPI example.
 *
 * Never opens EventSource/fetch, adds a proxy route, or requires a Factory host.
 * Pure model construction — no filesystem IO.
 */

import type { EventReconnectLifecycleCorpus } from "./event-reconnect-lifecycle";
import {
  EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES,
  EVENT_JSON_RECONNECT_PROBE_MEDIA_TYPE,
  EVENT_JSON_RECONNECT_RECOVERY_SCHEMA_NAME,
  EVENT_RECONNECT_CANONICAL_PATH,
  EVENT_RECONNECT_CURSOR_PARAM_NAMES,
} from "./event-reconnect-lifecycle";
import type { EventsOpenApiDocument } from "./openapi-document";
import { EVENT_STREAM_SAFETY } from "./stream-operations";

export const SSE_STATIC_EXAMPLE_ORIGIN = {
  illustrativeStaticFixture: "illustrative-static-fixture",
  openApiAuthored: "openapi-authored",
} as const;

export type SseStaticExampleOrigin =
  (typeof SSE_STATIC_EXAMPLE_ORIGIN)[keyof typeof SSE_STATIC_EXAMPLE_ORIGIN];

export const SSE_STATIC_EXAMPLE_KIND = {
  frame: "sse-frame",
  reconnectRequest: "reconnect-request",
  jsonReconnectProbe: "json-reconnect-probe",
} as const;

export type SseStaticExampleKind =
  (typeof SSE_STATIC_EXAMPLE_KIND)[keyof typeof SSE_STATIC_EXAMPLE_KIND];

export type SseStaticExample = {
  id: string;
  kind: SseStaticExampleKind;
  title: string;
  description: string;
  language: "text" | "http" | "json";
  code: string;
  origin: SseStaticExampleOrigin;
  originLabel: string;
  /** True when `id:` / `event:` / `data:` lines are present in the code. */
  includesSseWireFields?: boolean;
};

export type SseStaticExamplesCorpus = {
  examples: readonly SseStaticExample[];
  safety: typeof EVENT_STREAM_SAFETY;
  anchors: {
    section: "event-sse-static-examples";
    frame: "event-sse-frame-example";
    reconnect: "event-sse-reconnect-example";
    jsonProbe: "event-sse-json-reconnect-probe-example";
  };
};

const ILLUSTRATIVE_ORIGIN_LABEL = "Illustrative static fixture";
const OPENAPI_AUTHORED_ORIGIN_LABEL = "OpenAPI authored example";

/**
 * Minimal illustrative FactoryEvent data body. Uses real envelope field names
 * and schemaVersion enum; payload is an ellipsis placeholder — not a fabricated
 * full event.
 */
function illustrativeFactoryEventDataLine(eventType: string): string {
  return JSON.stringify({
    schemaVersion: "agent-factory.event.v1",
    id: "<event-id>",
    type: eventType,
    context: { "…": "see FactoryEvent catalog" },
    payload: { "…": "see payload variant for type" },
  });
}

function readAuthoredJsonReconnectProbeExample(
  doc: EventsOpenApiDocument,
): string | undefined {
  const schema =
    doc.components?.schemas?.[EVENT_JSON_RECONNECT_RECOVERY_SCHEMA_NAME];
  if (
    schema !== null &&
    typeof schema === "object" &&
    "example" in schema &&
    schema.example !== undefined
  ) {
    return `${JSON.stringify(schema.example, null, 2)}\n`;
  }
  return undefined;
}

function firstFactoryEventType(doc: EventsOpenApiDocument): string {
  const factoryEvent = doc.components?.schemas?.FactoryEvent;
  const mapping =
    factoryEvent !== null &&
    typeof factoryEvent === "object" &&
    "discriminator" in factoryEvent &&
    factoryEvent.discriminator !== null &&
    typeof factoryEvent.discriminator === "object" &&
    "mapping" in factoryEvent.discriminator &&
    factoryEvent.discriminator.mapping !== null &&
    typeof factoryEvent.discriminator.mapping === "object"
      ? (factoryEvent.discriminator.mapping as Record<string, string>)
      : undefined;

  if (mapping !== undefined) {
    const first = Object.keys(mapping)[0];
    if (first !== undefined) {
      return first;
    }
  }

  return "<FactoryEvent.type>";
}

function buildFactoryEventFrameExample(eventType: string): SseStaticExample {
  const data = illustrativeFactoryEventDataLine(eventType);
  const code = [
    "id: <decimal-or-stable-event-id>",
    "event: FactoryEvent",
    `data: ${data}`,
    "",
  ].join("\n");

  return {
    id: "factory-event-sse-frame",
    kind: SSE_STATIC_EXAMPLE_KIND.frame,
    title: "FactoryEvent SSE frame",
    description:
      "Illustrative text/event-stream frame shape for the canonical session stream. The data body uses real envelope field names; nested values are placeholders — decode full payloads from the FactoryEvent catalog.",
    language: "text",
    code,
    origin: SSE_STATIC_EXAMPLE_ORIGIN.illustrativeStaticFixture,
    originLabel: ILLUSTRATIVE_ORIGIN_LABEL,
    includesSseWireFields: true,
  };
}

function buildKeepaliveFrameExample(): SseStaticExample {
  return {
    id: "sse-keepalive-comment",
    kind: SSE_STATIC_EXAMPLE_KIND.frame,
    title: "SSE keepalive comment",
    description:
      "Illustrative keepalive comment line. Idle periods are normal waiting state, not terminal stream completion, unless the HTTP connection closes.",
    language: "text",
    code: ": keepalive\n\n",
    origin: SSE_STATIC_EXAMPLE_ORIGIN.illustrativeStaticFixture,
    originLabel: ILLUSTRATIVE_ORIGIN_LABEL,
    includesSseWireFields: false,
  };
}

function buildReconnectRequestExample(
  corpus: EventReconnectLifecycleCorpus,
): SseStaticExample {
  const cursorNames = corpus.reconnect.cursorParameters.map((p) => p.name);
  const primaryCursor =
    cursorNames.find((name) => name === "after_event_id") ??
    EVENT_RECONNECT_CURSOR_PARAM_NAMES[0];
  const headerLines = corpus.identity.headers
    .map((header) => `${header.name}: <compare-with-preflight-value>`)
    .join("\n");

  const code = [
    `GET ${EVENT_RECONNECT_CANONICAL_PATH.replace("{session_id}", "<session-id>")}?${primaryCursor}=<last-acknowledged-id> HTTP/1.1`,
    "Accept: text/event-stream",
    "Connection: keep-alive",
    headerLines,
    "",
    `# Cursor precedence: when both ${EVENT_RECONNECT_CURSOR_PARAM_NAMES.join(" and ")} are present, after_event_id wins.`,
    "# Compare handshake response headers before reusing a persisted cursor.",
    "# This is a static example — docs never open EventSource or fetch a Factory host.",
    "",
  ].join("\n");

  return {
    id: "canonical-sse-reconnect-request",
    kind: SSE_STATIC_EXAMPLE_KIND.reconnectRequest,
    title: "Canonical SSE reconnect request",
    description:
      "Illustrative reconnect request for the canonical session stream. Query cursor names and identity handshake headers match the documented contracts; values are placeholders.",
    language: "http",
    code,
    origin: SSE_STATIC_EXAMPLE_ORIGIN.illustrativeStaticFixture,
    originLabel: ILLUSTRATIVE_ORIGIN_LABEL,
  };
}

function buildJsonReconnectProbeExample(
  authoredCode: string | undefined,
  corpus: EventReconnectLifecycleCorpus,
): SseStaticExample {
  if (authoredCode !== undefined) {
    return {
      id: "json-reconnect-probe-response",
      kind: SSE_STATIC_EXAMPLE_KIND.jsonReconnectProbe,
      title: "JSON reconnect-probe response",
      description: `Authored OpenAPI example for ${EVENT_JSON_RECONNECT_RECOVERY_SCHEMA_NAME} on Accept: ${EVENT_JSON_RECONNECT_PROBE_MEDIA_TYPE}. Dual-Accept HTTP transport ownership remains on the API operation page.`,
      language: "json",
      code: authoredCode,
      origin: SSE_STATIC_EXAMPLE_ORIGIN.openApiAuthored,
      originLabel: OPENAPI_AUTHORED_ORIGIN_LABEL,
    };
  }

  const outcomes = corpus.jsonReconnectProbe.outcomes;
  const stale =
    outcomes.find((value) => value === "CURSOR_STALE") ??
    outcomes[0] ??
    "CURSOR_STALE";
  const illustrative = {
    factorySessionId: "<session-id>",
    outcome: stale,
    retry: {
      omitAfterEventId: true,
      omitAfterSequence: true,
    },
  };

  return {
    id: "json-reconnect-probe-response",
    kind: SSE_STATIC_EXAMPLE_KIND.jsonReconnectProbe,
    title: "JSON reconnect-probe response",
    description: `Illustrative ${EVENT_JSON_RECONNECT_RECOVERY_SCHEMA_NAME} shape for Accept: ${EVENT_JSON_RECONNECT_PROBE_MEDIA_TYPE}. Outcome values come from the live recovery enum; nested values are placeholders when OpenAPI omits an authored example.`,
    language: "json",
    code: `${JSON.stringify(illustrative, null, 2)}\n`,
    origin: SSE_STATIC_EXAMPLE_ORIGIN.illustrativeStaticFixture,
    originLabel: ILLUSTRATIVE_ORIGIN_LABEL,
  };
}

/**
 * Build static SSE frame + reconnect examples from packaged OpenAPI + the
 * reconnect lifecycle corpus (cursor/header names stay contract-aligned).
 */
export function buildSseStaticExamplesCorpus(
  doc: EventsOpenApiDocument,
  reconnectLifecycle: EventReconnectLifecycleCorpus,
): SseStaticExamplesCorpus {
  const eventType = firstFactoryEventType(doc);
  const authoredProbe = readAuthoredJsonReconnectProbeExample(doc);

  return {
    examples: [
      buildFactoryEventFrameExample(eventType),
      buildKeepaliveFrameExample(),
      buildReconnectRequestExample(reconnectLifecycle),
      buildJsonReconnectProbeExample(authoredProbe, reconnectLifecycle),
    ],
    safety: EVENT_STREAM_SAFETY,
    anchors: {
      section: "event-sse-static-examples",
      frame: "event-sse-frame-example",
      reconnect: "event-sse-reconnect-example",
      jsonProbe: "event-sse-json-reconnect-probe-example",
    },
  };
}

export function sseStaticFrameExamples(
  corpus: SseStaticExamplesCorpus,
): readonly SseStaticExample[] {
  return corpus.examples.filter(
    (example) => example.kind === SSE_STATIC_EXAMPLE_KIND.frame,
  );
}

export function sseStaticReconnectExamples(
  corpus: SseStaticExamplesCorpus,
): readonly SseStaticExample[] {
  return corpus.examples.filter(
    (example) =>
      example.kind === SSE_STATIC_EXAMPLE_KIND.reconnectRequest ||
      example.kind === SSE_STATIC_EXAMPLE_KIND.jsonReconnectProbe,
  );
}

/** Prove wire-shape fixtures mention required SSE field prefixes. */
export function sseFrameExampleHasWireFields(code: string): boolean {
  return (
    /(?:^|\n)id:/m.test(code) &&
    /(?:^|\n)event:/m.test(code) &&
    /(?:^|\n)data:/m.test(code)
  );
}

export function sseReconnectExampleUsesContractNames(code: string): boolean {
  const hasCursor = EVENT_RECONNECT_CURSOR_PARAM_NAMES.some((name) =>
    code.includes(name),
  );
  const hasHeader = EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES.some((name) =>
    code.includes(name),
  );
  return hasCursor && hasHeader;
}
