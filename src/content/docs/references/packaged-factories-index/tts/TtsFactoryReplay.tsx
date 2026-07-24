/**
 * Tts-child full-mode factory replay mount.
 *
 * Statically imports only the tts packaged-factory recording. Do not import
 * sibling `*.factory-recording.v1.json` files, corpus generators, or
 * FactoryRecordingTopologyReplay from this module.
 */

"use client";

import {
  type FactoryRecording,
  parseFactoryRecording,
} from "@you-agent-factory/client";
import type { ReactElement } from "react";
import { ControlledFactoryReplay } from "@/features/factory-replay";
import ttsRecordingJson from "../generated/tts.factory-recording.v1.json";

const ttsRecording: FactoryRecording = parseFactoryRecording(ttsRecordingJson);

/**
 * Host-controlled full-mode replay for the tts child reference page.
 */
export function TtsFactoryReplay(): ReactElement {
  return <ControlledFactoryReplay mode="full" recording={ttsRecording} />;
}
