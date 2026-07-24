import type { FactoryRecording } from "@you-agent-factory/client";

const FIXTURE_TOPOLOGY_EVENT = {
  schemaVersion: "agent-factory.event.v1" as const,
  id: "a-topology",
  type: "INITIAL_STRUCTURE_REQUEST" as const,
  context: {
    sequence: 1,
    tick: 1,
    eventTime: "2026-07-24T00:00:01Z",
    sessionId: "fixture-a-session",
    sessionSequence: 1,
  },
  payload: {
    factory: {
      name: "fixture-a",
      workers: [{ name: "agent" }],
      workTypes: [
        {
          name: "request",
          states: [
            { name: "queued", type: "INITIAL" as const },
            { name: "done", type: "TERMINAL" as const },
          ],
        },
      ],
      workstations: [
        {
          name: "desk",
          worker: "agent",
          inputs: [{ workType: "request", state: "queued" }],
          outputs: [{ workType: "request", state: "done" }],
        },
      ],
    },
  },
};

const FIXTURE_WORK_EVENT = {
  schemaVersion: "agent-factory.event.v1" as const,
  id: "a-work",
  type: "WORK_REQUEST" as const,
  context: {
    sequence: 2,
    tick: 2,
    eventTime: "2026-07-24T00:00:02Z",
    sessionId: "fixture-a-session",
    sessionSequence: 2,
  },
  payload: {
    type: "FACTORY_REQUEST_BATCH" as const,
    works: [
      {
        name: "Request 1",
        workId: "work-a-1",
        workTypeName: "request",
      },
    ],
  },
};

/**
 * Minimal serializable recording for factory-replay feature fixture tests.
 * Owned under this feature tree — not imported from generated packaged corpus.
 */
export const FIXTURE_RECORDING_A: FactoryRecording = {
  schemaVersion: "factory-recording/v1",
  id: "factory-replay-fixture-a",
  title: "Fixture A",
  factory: FIXTURE_TOPOLOGY_EVENT.payload.factory,
  events: [FIXTURE_TOPOLOGY_EVENT, FIXTURE_WORK_EVENT],
};

/** Second recording identity — must not share cache entries with fixture A. */
export const FIXTURE_RECORDING_B: FactoryRecording = {
  schemaVersion: "factory-recording/v1",
  id: "factory-replay-fixture-b",
  title: "Fixture B",
  factory: {
    ...FIXTURE_TOPOLOGY_EVENT.payload.factory,
    name: "fixture-b",
  },
  events: [
    {
      ...FIXTURE_TOPOLOGY_EVENT,
      id: "b-topology",
      context: {
        ...FIXTURE_TOPOLOGY_EVENT.context,
        sessionId: "fixture-b-session",
      },
      payload: {
        factory: {
          ...FIXTURE_TOPOLOGY_EVENT.payload.factory,
          name: "fixture-b",
        },
      },
    },
  ],
};
