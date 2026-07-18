/**
 * Story 007 — evidence helpers for @fumadocs/asyncapi render of the temporary
 * projected AsyncAPI fixture (channels / messages / payloads / examples).
 *
 * Pure classification over the regenerated projection + optional HTML probe.
 * Does not hand-edit AsyncAPI to paper over renderer gaps.
 */

import type { ProjectedAsyncApiDocument } from "./project-openapi-to-asyncapi";
import {
  channelIdForSelectedStream,
  messageIdForSelectedStream,
} from "./project-openapi-to-asyncapi";
import type { SelectedSseStream } from "./select-sse-streams";

export type AsyncApiRenderSurfaceObservation = {
  channelIds: string[];
  operationIds: string[];
  messageIds: string[];
  /** Messages whose payload.$ref points at the envelope x-event-schema root. */
  envelopePayloadRefs: string[];
  /** True when any projected message carries AsyncAPI message examples. */
  hasMessageExamples: boolean;
  /** Schema names present under components.schemas (closure). */
  schemaNamesSample: string[];
  schemaCount: number;
};

export type AsyncApiHtmlProbeResult = {
  channelMarkersPresent: boolean;
  messageMarkersPresent: boolean;
  envelopeSchemaTokensPresent: boolean;
  exampleTokensPresent: boolean;
  generatedFileNoticePresent: boolean;
  notes: string[];
};

export type AsyncApiRenderEvidence = {
  renderer: "@fumadocs/asyncapi";
  rendererVersion: "0.2.1";
  surface: AsyncApiRenderSurfaceObservation;
  /**
   * Message examples are not invented during projection. Absence is recorded
   * as a projection/renderer observation, not fixed by hand-editing AsyncAPI.
   */
  examplesStatus:
    | "present-on-messages"
    | "absent-not-invented"
    | "renderer-blocker";
  handEditedGeneratedAsyncApi: false;
};

/**
 * Observe what the regenerated AsyncAPI fixture exposes for the spike render.
 */
export function observeProjectedAsyncApiRenderSurface(
  asyncapi: ProjectedAsyncApiDocument,
  selectedStreams: readonly SelectedSseStream[],
): AsyncApiRenderSurfaceObservation {
  const channelIds = Object.keys(asyncapi.channels);
  const operationIds = Object.keys(asyncapi.operations);
  const messageIds = Object.keys(asyncapi.components.messages);
  const envelopePayloadRefs = messageIds.map((messageId) => {
    const message = asyncapi.components.messages[messageId];
    return message?.payload.$ref ?? "";
  });

  const hasMessageExamples = messageIds.some((messageId) => {
    const message = asyncapi.components.messages[messageId] as {
      examples?: unknown;
    };
    return Array.isArray(message.examples) && message.examples.length > 0;
  });

  const schemaNames = Object.keys(asyncapi.components.schemas);

  // Sanity: every selected stream has a channel + message id in the document.
  for (const stream of selectedStreams) {
    const channelId = channelIdForSelectedStream(stream);
    const messageId = messageIdForSelectedStream(stream);
    if (!channelIds.includes(channelId)) {
      throw new Error(
        `Projected AsyncAPI missing channel ${channelId} for ${stream.operationId}`,
      );
    }
    if (!messageIds.includes(messageId)) {
      throw new Error(
        `Projected AsyncAPI missing message ${messageId} for ${stream.operationId}`,
      );
    }
  }

  return {
    channelIds,
    operationIds,
    messageIds,
    envelopePayloadRefs,
    hasMessageExamples,
    schemaNamesSample: schemaNames.slice(0, 12),
    schemaCount: schemaNames.length,
  };
}

export function buildAsyncApiRenderEvidence(
  asyncapi: ProjectedAsyncApiDocument,
  selectedStreams: readonly SelectedSseStream[],
): AsyncApiRenderEvidence {
  const surface = observeProjectedAsyncApiRenderSurface(
    asyncapi,
    selectedStreams,
  );

  return {
    renderer: "@fumadocs/asyncapi",
    rendererVersion: "0.2.1",
    surface,
    examplesStatus: surface.hasMessageExamples
      ? "present-on-messages"
      : "absent-not-invented",
    handEditedGeneratedAsyncApi: false,
  };
}

/**
 * HTML probe for `/spikes/sse-asyncapi` browser verification.
 * Looks for observable channel/message/envelope tokens without requiring
 * hand-edited fixtures.
 */
export function probeAsyncApiSpikeHtml(html: string): AsyncApiHtmlProbeResult {
  const notes: string[] = [];
  const channelMarkersPresent =
    html.includes("getEventsBySessionId") &&
    html.includes("getFactoryResponseEventsBySessionId") &&
    html.includes("data-sse-asyncapi-spike-role");
  const messageMarkersPresent =
    html.includes("FactoryEvent") && html.includes("FactoryResponseEvent");
  const envelopeSchemaTokensPresent =
    html.includes("discriminator") ||
    html.includes("RUN_REQUEST") ||
    html.includes("x-envelope-attachment") ||
    html.includes("envelope-attached");
  const exampleTokensPresent =
    /example/i.test(html) &&
    (html.includes("message example") || html.includes("Message example"));
  const generatedFileNoticePresent =
    html.includes("GENERATED FILE") ||
    html.includes("Do not hand-edit") ||
    html.includes("x-generated-file-notice");

  if (!channelMarkersPresent) {
    notes.push(
      "Expected channel/role markers missing — confirm AsyncAPIPage received projected operations.",
    );
  }
  if (!messageMarkersPresent) {
    notes.push(
      "FactoryEvent / FactoryResponseEvent tokens missing from HTML — payload schemas may not be visible.",
    );
  }
  if (!envelopeSchemaTokensPresent) {
    notes.push(
      "Envelope discriminator / attachment tokens not observed in HTML. Document as renderer gap if channels still render; do not hand-edit AsyncAPI.",
    );
  }
  if (!exampleTokensPresent) {
    notes.push(
      "No message-example UI observed (expected when projection does not invent examples).",
    );
  }

  return {
    channelMarkersPresent,
    messageMarkersPresent,
    envelopeSchemaTokensPresent,
    exampleTokensPresent,
    generatedFileNoticePresent,
    notes,
  };
}
