/**
 * Compact-mode host-controlled factory replay composition.
 *
 * Wires FactoryTopologyReplay plus visible tick/timeline position and
 * Play/Pause for one injected recording. Does not render Work progress or
 * use FactoryRecordingTopologyReplay.
 */

"use client";

import type { FactoryRecording } from "@you-agent-factory/client";
import { FactoryTopologyReplay } from "@you-agent-factory/factory-visualizers";
import type { ReactElement } from "react";
import {
  type CompactModePresentationStatus,
  deriveCompactModeComposition,
} from "./compact-mode-composition";
import {
  type ControlledFactoryReplayMessages,
  DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES,
} from "./default-messages";
import { useControlledFactoryReplay } from "./use-controlled-factory-replay";

export type ControlledFactoryReplayCompactProps = {
  readonly className?: string;
  readonly formatNumber?: (value: number) => string;
  readonly messages?: ControlledFactoryReplayMessages;
  /**
   * Async host presentation. Defaults to `ready` when a recording is supplied.
   */
  readonly presentationStatus?: CompactModePresentationStatus;
  readonly recording: FactoryRecording;
  /** Test / non-DOM hosts can disable IntersectionObserver binding. */
  readonly bindDomGates?: boolean;
};

function defaultFormatNumber(value: number): string {
  return String(value);
}

/**
 * Compact client composition for one injected serializable recording.
 */
export function ControlledFactoryReplayCompact({
  bindDomGates = true,
  className,
  formatNumber = defaultFormatNumber,
  messages = DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES,
  presentationStatus = "ready",
  recording,
}: ControlledFactoryReplayCompactProps): ReactElement {
  const controller = useControlledFactoryReplay({
    bindDomGates,
    recording,
  });

  const composition = deriveCompactModeComposition({
    playback: presentationStatus === "ready" ? controller.playback : undefined,
    prepared: presentationStatus === "ready" ? controller.prepared : undefined,
    status: presentationStatus,
  });

  const playing =
    presentationStatus === "ready" ? controller.playback.playing : false;

  const selectedTickLabel =
    composition.selectedTick === undefined
      ? undefined
      : messages.chrome.selectedTick(formatNumber(composition.selectedTick));

  const timelinePositionLabel =
    composition.selectedTick === undefined ||
    composition.latestTick === undefined
      ? undefined
      : messages.timeline.position(
          formatNumber(composition.selectedTick),
          formatNumber(composition.latestTick),
        );

  return (
    <section
      aria-label={messages.chrome.regionLabel}
      className={
        className
          ? `factory-replay factory-replay--compact ${className}`
          : "factory-replay factory-replay--compact"
      }
      data-factory-replay-mode="compact"
      data-playing={playing ? "true" : "false"}
      data-presentation-status={presentationStatus}
      data-progress-visible="false"
      data-selected-tick={
        composition.selectedTick === undefined
          ? undefined
          : String(composition.selectedTick)
      }
      ref={controller.rootRef}
    >
      <div className="factory-replay__playback-controls">
        <button
          disabled={presentationStatus !== "ready"}
          onClick={() => {
            if (playing) {
              controller.dispatch.pause();
              return;
            }
            controller.dispatch.play();
          }}
          type="button"
        >
          {playing ? messages.chrome.pause : messages.chrome.play}
        </button>
      </div>

      {selectedTickLabel ? (
        <p className="factory-replay__selected-tick">{selectedTickLabel}</p>
      ) : null}

      {timelinePositionLabel ? (
        <p className="factory-replay__timeline-position">
          {timelinePositionLabel}
        </p>
      ) : null}

      <FactoryTopologyReplay
        messages={messages.topology}
        state={composition.topology}
      />
    </section>
  );
}
