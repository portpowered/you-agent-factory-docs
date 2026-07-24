/**
 * Review-child full-mode factory replay mount.
 *
 * Statically imports only the review packaged-factory recording. Do not import
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
import reviewRecordingJson from "../generated/review.factory-recording.v1.json";

const reviewRecording: FactoryRecording =
  parseFactoryRecording(reviewRecordingJson);

/**
 * Host-controlled full-mode replay for the review child reference page.
 */
export function ReviewFactoryReplay(): ReactElement {
  return <ControlledFactoryReplay mode="full" recording={reviewRecording} />;
}
