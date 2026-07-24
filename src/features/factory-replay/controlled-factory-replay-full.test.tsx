import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { ControlledFactoryReplayFull } from "./controlled-factory-replay-full";
import { DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES } from "./default-messages";
import { FIXTURE_RECORDING_A } from "./fixtures";

afterEach(() => {
  cleanup();
});

describe("ControlledFactoryReplayFull", () => {
  test("renders timeline scrubber, topology, and work progress for a ready recording", () => {
    render(
      <ControlledFactoryReplayFull
        bindDomGates={false}
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const root = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.getAttribute("data-factory-replay-mode")).toBe("full");
    expect(root.getAttribute("data-presentation-status")).toBe("ready");
    expect(root.getAttribute("data-selected-tick")).toBe("2");

    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.regionLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeTruthy();
  });

  test("Play, Pause, Reset, Select tick, and Follow latest update host-owned tick state", () => {
    render(
      <ControlledFactoryReplayFull
        bindDomGates={false}
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const root = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.getAttribute("data-playing")).toBe("false");
    expect(root.getAttribute("data-selected-tick")).toBe("2");

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(root.getAttribute("data-playing")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(root.getAttribute("data-playing")).toBe("false");

    const scrubber = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
    });
    const slider = within(scrubber).getByRole("slider", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.sliderLabel,
    });
    fireEvent.change(slider, { target: { value: "1" } });
    expect(root.getAttribute("data-selected-tick")).toBe("1");
    expect(scrubber.getAttribute("data-timeline-mode")).toBe("history");

    fireEvent.click(
      within(scrubber).getByRole("button", { name: "Follow latest" }),
    );
    expect(root.getAttribute("data-selected-tick")).toBe("2");
    expect(scrubber.getAttribute("data-timeline-mode")).toBe("current");

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.change(slider, { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(root.getAttribute("data-playing")).toBe("false");
    expect(root.getAttribute("data-selected-tick")).toBe("2");
  });

  test("loading presentation keeps scrubber unavailable and topology loading", () => {
    render(
      <ControlledFactoryReplayFull
        bindDomGates={false}
        presentationStatus="loading"
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const scrubber = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
    });
    expect(scrubber.getAttribute("data-timeline-mode")).toBe("unavailable");
    expect(within(scrubber).getByRole("status").textContent).toBe(
      DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.unavailable,
    );

    const topology = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.regionLabel,
    });
    expect(within(topology).getByRole("status").textContent).toBe(
      DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.loading,
    );
  });

  test("failed presentation keeps scrubber unavailable and topology failed", () => {
    render(
      <ControlledFactoryReplayFull
        bindDomGates={false}
        presentationStatus="failed"
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const scrubber = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
    });
    expect(scrubber.getAttribute("data-timeline-mode")).toBe("unavailable");

    const topology = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.regionLabel,
    });
    expect(within(topology).getByRole("alert").textContent).toBe(
      DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.failed,
    );
  });

  test("composes controlled visualizers without a recording-owned tick owner", () => {
    render(
      <ControlledFactoryReplayFull
        bindDomGates={false}
        recording={FIXTURE_RECORDING_A}
      />,
    );

    // Host owns selected tick (data attribute) while package-controlled regions
    // are present — not a FactoryRecordingTopologyReplay wrapper region.
    const root = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.className.includes("factory-recording-topology-replay")).toBe(
      false,
    );
    expect(root.getAttribute("data-factory-replay-mode")).toBe("full");
    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeTruthy();
  });
});
