/**
 * Goal-child full-mode factory replay mount.
 *
 * Statically imports only the goal packaged-factory recording. Do not import
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
import goalRecordingJson from "../generated/goal.factory-recording.v1.json";

const goalRecording: FactoryRecording =
  parseFactoryRecording(goalRecordingJson);

/**
 * Host-controlled full-mode replay for the goal child reference page.
 */
export function GoalFactoryReplay(): ReactElement {
  return <ControlledFactoryReplay mode="full" recording={goalRecording} />;
}
