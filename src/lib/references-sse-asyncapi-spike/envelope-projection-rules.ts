/**
 * Story 006 — envelope-attachment rules for the temporary OpenAPI→AsyncAPI
 * projector.
 *
 * - FactoryEvent `type` discriminator mappings stay on the event envelope;
 *   payload schemas are never presented as complete standalone event messages.
 * - FactoryResponseEvent documents kind / phase / structural payload selection
 *   without inventing a discriminator absent from OpenAPI.
 *
 * Pure helpers — no filesystem IO.
 */

import {
  FACTORY_EVENT_SCHEMA_NAME,
  FACTORY_EVENT_SCHEMA_REF,
  FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME,
  FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_REF,
  FACTORY_RESPONSE_EVENT_SCHEMA_NAME,
  FACTORY_RESPONSE_EVENT_SCHEMA_REF,
} from "./event-schema-discoverability";
import type { SelectedSseStream } from "./select-sse-streams";

/** Messages always reference the x-event-schema envelope root — never a payload-only schema. */
export const ENVELOPE_ATTACHMENT_MODE = "envelope-attached" as const;

/**
 * Documented selection rule for FactoryResponseEvent. Mirrors OpenAPI contract
 * prose: kind + phase + structural decoding. Explicitly does not invent a
 * `discriminator.mapping` like FactoryEvent.type.
 */
export const FACTORY_RESPONSE_EVENT_PAYLOAD_SELECTION_RULE =
  "Select the FactoryResponseEvent payload variant using envelope kind and phase together with structural decoding. OpenAPI does not supply a single simple discriminator mapping like FactoryEvent.type; this projection does not invent one." as const;

export const FACTORY_EVENT_ENVELOPE_ATTACHMENT_NOTE =
  "FactoryEvent type discriminator mappings remain attached to the envelope schema (propertyName: type). Payload schemas referenced by discriminator.mapping / payload.oneOf are payload fragments only — not complete standalone event messages." as const;

export type EnvelopeAttachmentMode = typeof ENVELOPE_ATTACHMENT_MODE;

/** Minimal projected AsyncAPI shape needed for envelope-rule checks. */
export type EnvelopeProjectedAsyncApi = {
  components: {
    messages: Record<
      string,
      {
        payload: { $ref: string };
        "x-envelope-attachment"?: EnvelopeAttachmentMode;
        "x-invented-discriminator"?: false;
        "x-payload-selection-rule"?: string;
        "x-envelope-attachment-note"?: string;
        description?: string;
      }
    >;
    schemas: Record<string, unknown>;
  };
};

function messageIdForStream(stream: SelectedSseStream): string {
  if (stream.payloadRootSchemaName.length > 0) {
    return `${stream.operationId}__${stream.payloadRootSchemaName}`;
  }
  return `${stream.operationId}__payload`;
}

export type EnvelopeProjectionMessageAnnotations = {
  "x-envelope-attachment": EnvelopeAttachmentMode;
  /**
   * Always false: projection never invents a discriminator mapping absent from
   * the packaged OpenAPI root schema.
   */
  "x-invented-discriminator": false;
  /** Present when the root is FactoryResponseEvent (kind/phase/structural). */
  "x-payload-selection-rule"?: typeof FACTORY_RESPONSE_EVENT_PAYLOAD_SELECTION_RULE;
  /** Present when the root is FactoryEvent (envelope type discriminator). */
  "x-envelope-attachment-note"?: typeof FACTORY_EVENT_ENVELOPE_ATTACHMENT_NOTE;
};

export type FactoryEventEnvelopeEvidence = {
  rootSchemaName: typeof FACTORY_EVENT_SCHEMA_NAME;
  rootSchemaRef: typeof FACTORY_EVENT_SCHEMA_REF;
  envelopeAttachment: EnvelopeAttachmentMode;
  discriminatorPropertyName: string | undefined;
  mappingCount: number;
  /** Sample mapping targets — payload schema refs, not message ids. */
  mappingTargetRefs: string[];
  /** True when no AsyncAPI message payload points at a mapping-target payload schema alone. */
  payloadSchemasNotStandaloneMessages: boolean;
  inventedDiscriminator: false;
};

export type FactoryResponseEventEnvelopeEvidence = {
  rootSchemaName: typeof FACTORY_RESPONSE_EVENT_SCHEMA_NAME;
  rootSchemaRef: typeof FACTORY_RESPONSE_EVENT_SCHEMA_REF;
  envelopeAttachment: EnvelopeAttachmentMode;
  hasKindProperty: boolean;
  hasPhaseProperty: boolean;
  payloadSchemaRef: string | undefined;
  payloadVariantCount: number;
  /** Envelope schema still has no discriminator after projection. */
  envelopeHasDiscriminator: boolean;
  /** Payload union still has no discriminator after projection. */
  payloadHasDiscriminator: boolean;
  payloadSelectionRule: typeof FACTORY_RESPONSE_EVENT_PAYLOAD_SELECTION_RULE;
  inventedDiscriminator: false;
};

export type EnvelopeProjectionEvidence = {
  factoryEvent: FactoryEventEnvelopeEvidence;
  factoryResponseEvent: FactoryResponseEventEnvelopeEvidence;
  /** One row per projected message — all must be envelope-attached. */
  messages: Array<{
    messageId: string;
    operationId: string;
    role: SelectedSseStream["role"];
    payloadRef: string;
    envelopeAttachment: EnvelopeAttachmentMode;
    inventedDiscriminator: false;
  }>;
};

type SchemaObjectLike = {
  discriminator?: {
    propertyName?: string;
    mapping?: Record<string, string>;
  };
  properties?: Record<string, unknown>;
  oneOf?: unknown[];
  $ref?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asSchemaObject(value: unknown): SchemaObjectLike | undefined {
  return isRecord(value) ? (value as SchemaObjectLike) : undefined;
}

function readDiscriminator(schema: SchemaObjectLike | undefined): {
  propertyName: string | undefined;
  mapping: Record<string, string>;
} {
  if (!isRecord(schema?.discriminator)) {
    return { propertyName: undefined, mapping: {} };
  }
  const propertyName =
    typeof schema.discriminator.propertyName === "string"
      ? schema.discriminator.propertyName
      : undefined;
  const mappingRaw = schema.discriminator.mapping;
  const mapping: Record<string, string> = {};
  if (isRecord(mappingRaw)) {
    for (const [key, value] of Object.entries(mappingRaw)) {
      if (typeof value === "string") mapping[key] = value;
    }
  }
  return { propertyName, mapping };
}

function hasDiscriminatorObject(schema: SchemaObjectLike | undefined): boolean {
  const { propertyName, mapping } = readDiscriminator(schema);
  return propertyName !== undefined || Object.keys(mapping).length > 0;
}

/**
 * Build AsyncAPI message annotations that document envelope attachment and
 * (for FactoryResponseEvent) kind/phase/payload selection — without inventing
 * a discriminator.
 */
export function buildEnvelopeMessageAnnotations(
  payloadRootSchemaName: string,
): EnvelopeProjectionMessageAnnotations {
  const base: EnvelopeProjectionMessageAnnotations = {
    "x-envelope-attachment": ENVELOPE_ATTACHMENT_MODE,
    "x-invented-discriminator": false,
  };

  if (payloadRootSchemaName === FACTORY_EVENT_SCHEMA_NAME) {
    return {
      ...base,
      "x-envelope-attachment-note": FACTORY_EVENT_ENVELOPE_ATTACHMENT_NOTE,
    };
  }

  if (payloadRootSchemaName === FACTORY_RESPONSE_EVENT_SCHEMA_NAME) {
    return {
      ...base,
      "x-payload-selection-rule": FACTORY_RESPONSE_EVENT_PAYLOAD_SELECTION_RULE,
    };
  }

  // Renamed / unknown roots still stay envelope-attached; never invent a
  // discriminator mapping for them either.
  return base;
}

/**
 * Append envelope / payload-selection prose to a message description.
 */
export function appendEnvelopeRuleDescription(
  baseDescription: string,
  payloadRootSchemaName: string,
): string {
  if (payloadRootSchemaName === FACTORY_EVENT_SCHEMA_NAME) {
    return `${baseDescription} ${FACTORY_EVENT_ENVELOPE_ATTACHMENT_NOTE}`;
  }
  if (payloadRootSchemaName === FACTORY_RESPONSE_EVENT_SCHEMA_NAME) {
    return `${baseDescription} ${FACTORY_RESPONSE_EVENT_PAYLOAD_SELECTION_RULE}`;
  }
  return `${baseDescription} Message payload is the x-event-schema envelope root (envelope-attached); payload variant schemas are not complete standalone event messages.`;
}

/**
 * True when every projected message payload `$ref` equals the stream's
 * x-event-schema envelope root (not a nested payload-only schema).
 */
export function messagesAreEnvelopeAttached(
  asyncapi: EnvelopeProjectedAsyncApi,
  streams: readonly SelectedSseStream[],
): boolean {
  for (const stream of streams) {
    const messageId = messageIdForStream(stream);
    const message = asyncapi.components.messages[messageId];
    if (!message) return false;
    if (message.payload.$ref !== stream.payloadRootRef) return false;
    if (message["x-envelope-attachment"] !== ENVELOPE_ATTACHMENT_MODE) {
      return false;
    }
    if (message["x-invented-discriminator"] !== false) return false;
  }
  return true;
}

/**
 * True when no AsyncAPI message treats a FactoryEvent discriminator mapping
 * target (payload schema) as a complete standalone event message.
 */
export function payloadSchemasAreNotStandaloneMessages(
  asyncapi: EnvelopeProjectedAsyncApi,
  factoryEventSchema: unknown,
): boolean {
  const envelope = asSchemaObject(factoryEventSchema);
  const { mapping } = readDiscriminator(envelope);
  const payloadOnlyRefs = new Set(Object.values(mapping));

  // Also treat payload.oneOf `$ref`s as payload-only fragments.
  const payloadProp = envelope?.properties?.payload;
  if (isRecord(payloadProp) && Array.isArray(payloadProp.oneOf)) {
    for (const entry of payloadProp.oneOf) {
      if (isRecord(entry) && typeof entry.$ref === "string") {
        payloadOnlyRefs.add(entry.$ref);
      }
    }
  }

  for (const message of Object.values(asyncapi.components.messages)) {
    if (payloadOnlyRefs.has(message.payload.$ref)) {
      return false;
    }
  }
  return true;
}

/**
 * Collect machine-checkable envelope-attachment evidence from a projection.
 */
export function observeEnvelopeProjectionEvidence(
  asyncapi: EnvelopeProjectedAsyncApi,
  streams: readonly SelectedSseStream[],
): EnvelopeProjectionEvidence {
  const schemas = asyncapi.components.schemas;
  const factoryEventSchema = schemas[FACTORY_EVENT_SCHEMA_NAME];
  const factoryResponseSchema = schemas[FACTORY_RESPONSE_EVENT_SCHEMA_NAME];
  const factoryResponsePayloadSchema =
    schemas[FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_NAME];

  const fe = asSchemaObject(factoryEventSchema);
  const fre = asSchemaObject(factoryResponseSchema);
  const frep = asSchemaObject(factoryResponsePayloadSchema);
  const feDisc = readDiscriminator(fe);

  const freProps = fre?.properties;
  const frePayload = isRecord(freProps?.payload) ? freProps.payload : undefined;
  const frePayloadRef =
    typeof frePayload?.$ref === "string" ? frePayload.$ref : undefined;

  const payloadVariantCount = Array.isArray(frep?.oneOf)
    ? frep.oneOf.length
    : 0;

  const messages: EnvelopeProjectionEvidence["messages"] = [];
  for (const stream of streams) {
    const messageId = messageIdForStream(stream);
    const message = asyncapi.components.messages[messageId];
    if (!message) {
      throw new Error(`Missing projected message ${messageId}`);
    }
    messages.push({
      messageId,
      operationId: stream.operationId,
      role: stream.role,
      payloadRef: message.payload.$ref,
      envelopeAttachment: ENVELOPE_ATTACHMENT_MODE,
      inventedDiscriminator: false,
    });
  }

  return {
    factoryEvent: {
      rootSchemaName: FACTORY_EVENT_SCHEMA_NAME,
      rootSchemaRef: FACTORY_EVENT_SCHEMA_REF,
      envelopeAttachment: ENVELOPE_ATTACHMENT_MODE,
      discriminatorPropertyName: feDisc.propertyName,
      mappingCount: Object.keys(feDisc.mapping).length,
      mappingTargetRefs: Object.values(feDisc.mapping).sort(),
      payloadSchemasNotStandaloneMessages:
        payloadSchemasAreNotStandaloneMessages(asyncapi, factoryEventSchema),
      inventedDiscriminator: false,
    },
    factoryResponseEvent: {
      rootSchemaName: FACTORY_RESPONSE_EVENT_SCHEMA_NAME,
      rootSchemaRef: FACTORY_RESPONSE_EVENT_SCHEMA_REF,
      envelopeAttachment: ENVELOPE_ATTACHMENT_MODE,
      hasKindProperty: isRecord(freProps?.kind),
      hasPhaseProperty: isRecord(freProps?.phase),
      payloadSchemaRef: frePayloadRef,
      payloadVariantCount,
      envelopeHasDiscriminator: hasDiscriminatorObject(fre),
      payloadHasDiscriminator: hasDiscriminatorObject(frep),
      payloadSelectionRule: FACTORY_RESPONSE_EVENT_PAYLOAD_SELECTION_RULE,
      inventedDiscriminator: false,
    },
    messages,
  };
}

/**
 * Fail closed when envelope rules are violated (payload-only messages or an
 * invented FactoryResponseEvent discriminator).
 */
export function assertEnvelopeProjectionRules(
  asyncapi: EnvelopeProjectedAsyncApi,
  streams: readonly SelectedSseStream[],
): EnvelopeProjectionEvidence {
  const evidence = observeEnvelopeProjectionEvidence(asyncapi, streams);

  if (!messagesAreEnvelopeAttached(asyncapi, streams)) {
    throw new Error(
      "Envelope projection rule violated: one or more messages are not envelope-attached to their x-event-schema root.",
    );
  }

  if (!evidence.factoryEvent.payloadSchemasNotStandaloneMessages) {
    throw new Error(
      "Envelope projection rule violated: a FactoryEvent payload schema is presented as a standalone event message.",
    );
  }

  if (
    evidence.factoryEvent.discriminatorPropertyName !== "type" ||
    evidence.factoryEvent.mappingCount === 0
  ) {
    throw new Error(
      "Envelope projection rule violated: FactoryEvent envelope lost its type discriminator mapping.",
    );
  }

  if (
    evidence.factoryResponseEvent.envelopeHasDiscriminator ||
    evidence.factoryResponseEvent.payloadHasDiscriminator
  ) {
    throw new Error(
      "Envelope projection rule violated: invented FactoryResponseEvent discriminator detected.",
    );
  }

  if (
    !evidence.factoryResponseEvent.hasKindProperty ||
    !evidence.factoryResponseEvent.hasPhaseProperty
  ) {
    throw new Error(
      "Envelope projection rule violated: FactoryResponseEvent kind/phase properties missing from projected envelope.",
    );
  }

  if (
    evidence.factoryResponseEvent.payloadSchemaRef !==
    FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_REF
  ) {
    throw new Error(
      `Envelope projection rule violated: expected FactoryResponseEvent.payload $ref ${FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_REF}, found ${String(evidence.factoryResponseEvent.payloadSchemaRef)}.`,
    );
  }

  // Message annotations must document the response-event selection rule.
  for (const stream of streams) {
    if (stream.payloadRootSchemaName !== FACTORY_RESPONSE_EVENT_SCHEMA_NAME) {
      continue;
    }
    const messageId = messageIdForStream(stream);
    const message = asyncapi.components.messages[messageId];
    if (
      message?.["x-payload-selection-rule"] !==
      FACTORY_RESPONSE_EVENT_PAYLOAD_SELECTION_RULE
    ) {
      throw new Error(
        `Envelope projection rule violated: message ${messageId} missing FactoryResponseEvent payload-selection documentation.`,
      );
    }
  }

  return evidence;
}
