import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { ControlledFactoryReplayCompact } from "./controlled-factory-replay-compact";
import { ControlledFactoryReplayFull } from "./controlled-factory-replay-full";
import { DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES } from "./default-messages";
import { FIXTURE_RECORDING_A } from "./fixtures";

afterEach(() => {
  cleanup();
});

describe("ControlledFactoryReplayCompact", () => {
  test("renders topology, tick/timeline position, and Play/Pause without Work progress", () => {
    render(
      <ControlledFactoryReplayCompact
        bindDomGates={false}
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const root = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.getAttribute("data-factory-replay-mode")).toBe("compact");
    expect(root.getAttribute("data-presentation-status")).toBe("ready");
    expect(root.getAttribute("data-progress-visible")).toBe("false");
    expect(root.getAttribute("data-selected-tick")).toBe("2");

    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.regionLabel,
      }),
    ).toBeTruthy();
    expect(screen.getByText("Selected tick 2")).toBeTruthy();
    expect(screen.getByText("Tick 2 of 2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();

    expect(
      screen.queryByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
      }),
    ).toBeNull();
  });

  test("Play and Pause update host-owned playing state", () => {
    render(
      <ControlledFactoryReplayCompact
        bindDomGates={false}
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const root = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.getAttribute("data-playing")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(root.getAttribute("data-playing")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(root.getAttribute("data-playing")).toBe("false");
  });

  test("loading presentation keeps topology loading without Work progress", () => {
    render(
      <ControlledFactoryReplayCompact
        bindDomGates={false}
        presentationStatus="loading"
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const topology = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.regionLabel,
    });
    expect(within(topology).getByRole("status").textContent).toBe(
      DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.loading,
    );
    expect(
      screen.queryByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeNull();
  });

  test("composes without FactoryRecordingTopologyReplay ownership", () => {
    render(
      <ControlledFactoryReplayCompact
        bindDomGates={false}
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const root = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.className.includes("factory-recording-topology-replay")).toBe(
      false,
    );
    expect(root.getAttribute("data-factory-replay-mode")).toBe("compact");
  });
});

describe("compact vs full region differences", () => {
  test("same recording: Work progress present in full, absent in compact", () => {
    const { unmount: unmountFull } = render(
      <ControlledFactoryReplayFull
        bindDomGates={false}
        recording={FIXTURE_RECORDING_A}
      />,
    );

    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
      }),
    ).toBeTruthy();
    unmountFull();

    render(
      <ControlledFactoryReplayCompact
        bindDomGates={false}
        recording={FIXTURE_RECORDING_A}
      />,
    );

    expect(
      screen.queryByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
      }),
    ).toBeNull();
    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.regionLabel,
      }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });
});
