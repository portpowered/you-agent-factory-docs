/**
 * Subprocess proof that createAsyncAPI loads the regenerated projection.
 * Runs outside happy-dom (same pattern as prove-create-openapi-load.ts).
 */

import { createSseSpikeAsyncApi } from "./create-sse-spike-asyncapi";

const spike = createSseSpikeAsyncApi();
const loaded = await spike.server.getSchema(spike.documentId);

const payload = {
  ok: true,
  operationCount: Object.keys(loaded.bundled.operations ?? {}).length,
  messageCount: Object.keys(loaded.bundled.components?.messages ?? {}).length,
  channelCount: Object.keys(loaded.bundled.channels ?? {}).length,
  handEdited: false as const,
  permanentProductionPin: spike.packagePin.permanentProductionPin,
  documentId: spike.documentId,
  sourceHash: spike.projection.sourceHash,
};

process.stdout.write(`${JSON.stringify(payload)}\n`);
