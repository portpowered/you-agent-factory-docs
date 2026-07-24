/**
 * Deliberate pollution fixture for Youi landing import-graph positive control.
 *
 * Production landing composition must never import this module. Tests start a
 * Bun metafile collection from here so the detector still observes forbidden
 * markers when the entry graph is intentionally polluted.
 */

import deepResearchSource from "@/content/docs/references/packaged-factories-index/generated/deep-research.source.json";
import indexCorpus from "@/content/docs/references/packaged-factories-index/generated/index.json";
import ttsRecording from "@/content/docs/references/packaged-factories-index/generated/tts.factory-recording.v1.json";

export const YOUI_LANDING_IMPORT_GRAPH_POLLUTED_FIXTURE = {
  deepResearchSource,
  indexCorpus,
  ttsRecording,
} as const;
