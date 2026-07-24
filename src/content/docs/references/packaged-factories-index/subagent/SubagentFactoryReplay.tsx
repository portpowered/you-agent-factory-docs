/**
 * Subagent-child full-mode factory replay mount.
 *
 * Statically imports only the subagent packaged-factory recording. Do not
 * import sibling `*.factory-recording.v1.json` files, corpus generators, or
 * FactoryRecordingTopologyReplay from this module.
 */

"use client";

import {
  type FactoryRecording,
  parseFactoryRecording,
} from "@you-agent-factory/client";
import type { ReactElement } from "react";
import { ControlledFactoryReplay } from "@/features/factory-replay";
import subagentRecordingJson from "../generated/subagent.factory-recording.v1.json";

const subagentRecording: FactoryRecording = parseFactoryRecording(
  subagentRecordingJson,
);

/**
 * Host-controlled full-mode replay for the subagent child reference page.
 */
export function SubagentFactoryReplay(): ReactElement {
  return <ControlledFactoryReplay mode="full" recording={subagentRecording} />;
}
