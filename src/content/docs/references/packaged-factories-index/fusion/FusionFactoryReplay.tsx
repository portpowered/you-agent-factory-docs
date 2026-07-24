/**
 * Fusion-child full-mode factory replay mount.
 *
 * Statically imports only the fusion packaged-factory recording. Do not import
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
import fusionRecordingJson from "../generated/fusion.factory-recording.v1.json";

const fusionRecording: FactoryRecording =
  parseFactoryRecording(fusionRecordingJson);

/**
 * Host-controlled full-mode replay for the fusion child reference page.
 */
export function FusionFactoryReplay(): ReactElement {
  return <ControlledFactoryReplay mode="full" recording={fusionRecording} />;
}
