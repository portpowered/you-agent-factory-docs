/**
 * Full-mode host-controlled factory replay composition.
 *
 * Wires FactoryTimelineScrubber, FactoryTopologyReplay, and
 * WorkProgressVisualizer to one injected recording with host-owned selected
 * tick. Does not use FactoryRecordingTopologyReplay.
 */

"use client";

import type { FactoryRecording } from "@you-agent-factory/client";
import {
  FactoryTimelineScrubber,
  FactoryTopologyReplay,
  WorkProgressVisualizer,
} from "@you-agent-factory/factory-visualizers";
import type { ReactElement } from "react";
import {
  type ControlledFactoryReplayMessages,
  DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES,
} from "./default-messages";
import {
  deriveFullModeComposition,
  type FullModePresentationStatus,
} from "./full-mode-composition";
import { useControlledFactoryReplay } from "./use-controlled-factory-replay";

export type ControlledFactoryReplayFullProps = {
  readonly className?: string;
  readonly formatNumber?: (value: number) => string;
  readonly messages?: ControlledFactoryReplayMessages;
  /**
   * Async host presentation. Defaults to `ready` when a recording is supplied.
   * Loading / failed keep the timeline scrubber unavailable.
   */
  readonly presentationStatus?: FullModePresentationStatus;
  readonly recording: FactoryRecording;
  /** Test / non-DOM hosts can disable IntersectionObserver binding. */
  readonly bindDomGates?: boolean;
};

function defaultFormatNumber(value: number): string {
  return String(value);
}

/**
 * Full-mode client composition for one injected serializable recording.
 */
export function ControlledFactoryReplayFull({
  bindDomGates = true,
  className,
  formatNumber = defaultFormatNumber,
  messages = DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES,
  presentationStatus = "ready",
  recording,
}: ControlledFactoryReplayFullProps): ReactElement {
  const controller = useControlledFactoryReplay({
    bindDomGates,
    recording,
  });

  const composition = deriveFullModeComposition({
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

  return (
    <section
      aria-label={messages.chrome.regionLabel}
      className={
        className
          ? `factory-replay factory-replay--full ${className}`
          : "factory-replay factory-replay--full"
      }
      data-factory-replay-mode="full"
      data-playing={playing ? "true" : "false"}
      data-presentation-status={presentationStatus}
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
        <button
          disabled={presentationStatus !== "ready"}
          onClick={() => {
            controller.dispatch.reset();
          }}
          type="button"
        >
          {messages.chrome.reset}
        </button>
      </div>

      {selectedTickLabel ? (
        <p className="factory-replay__selected-tick">{selectedTickLabel}</p>
      ) : null}

      <FactoryTimelineScrubber
        formatTick={formatNumber}
        messages={messages.timeline}
        onFollowLatest={() => {
          controller.dispatch.followLatest();
        }}
        onSelectTick={(tick) => {
          controller.dispatch.selectTick(tick);
        }}
        state={composition.timeline}
      />

      <FactoryTopologyReplay
        messages={messages.topology}
        state={composition.topology}
      />

      {composition.progressVisible && presentationStatus === "ready" ? (
        <WorkProgressVisualizer
          formatNumber={formatNumber}
          messages={messages.progress}
          projection={controller.prepared.progress}
        />
      ) : null}

      {composition.progressVisible && presentationStatus !== "ready" ? (
        <section
          aria-label={messages.progress.regionLabel}
          className="factory-replay__progress-placeholder"
          data-progress-status={presentationStatus}
        >
          <p>{messages.progress.empty}</p>
        </section>
      ) : null}
    </section>
  );
}
