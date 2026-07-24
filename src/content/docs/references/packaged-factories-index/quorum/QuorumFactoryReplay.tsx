/**
 * Quorum-child full-mode factory replay mount.
 *
 * Statically imports only the quorum packaged-factory recording. Do not import
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
import quorumRecordingJson from "../generated/quorum.factory-recording.v1.json";

const quorumRecording: FactoryRecording =
  parseFactoryRecording(quorumRecordingJson);

/**
 * Host-controlled full-mode replay for the quorum child reference page.
 */
export function QuorumFactoryReplay(): ReactElement {
  return <ControlledFactoryReplay mode="full" recording={quorumRecording} />;
}
