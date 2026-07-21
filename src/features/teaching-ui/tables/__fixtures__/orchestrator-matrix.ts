/**
 * Deterministic teaching-ui table fixtures for harness + tests.
 * Not production registry JSON — W-table owns fixtures only.
 */

import type { AttributeDef, OrchestratorRecord } from "../types";

export const FIXTURE_ATTRIBUTE_DEFS: AttributeDef[] = [
  {
    id: "attr.open-source",
    labelKey: "attrs.openSource",
    type: "boolean",
    filterable: true,
    sortable: true,
    order: 1,
  },
  {
    id: "attr.summary",
    labelKey: "attrs.summary",
    type: "string",
    filterable: true,
    sortable: true,
    order: 2,
  },
  {
    id: "attr.license",
    labelKey: "attrs.license",
    type: "single-tag",
    tagEnum: ["mit", "apache-2.0", "proprietary"],
    filterable: true,
    sortable: true,
    order: 3,
  },
  {
    id: "attr.capabilities",
    labelKey: "attrs.capabilities",
    type: "multi-tag",
    tagEnum: ["loop", "worktree", "harness"],
    filterable: true,
    sortable: false,
    order: 4,
  },
];

export const FIXTURE_ATTRIBUTE_LABELS: Readonly<Record<string, string>> = {
  "attr.open-source": "Open source",
  "attr.summary": "Summary",
  "attr.license": "License",
  "attr.capabilities": "Capabilities",
};

export const FIXTURE_ORCHESTRATORS: OrchestratorRecord[] = [
  {
    id: "orch-alpha",
    kind: "orchestrator",
    name: "Alpha",
    attributes: {
      "attr.open-source": true,
      "attr.summary": "Persistent loop factory",
      "attr.license": "mit",
      "attr.capabilities": ["loop", "harness"],
    },
  },
  {
    id: "orch-beta",
    kind: "orchestrator",
    name: "Beta",
    attributes: {
      "attr.open-source": false,
      "attr.summary": "Worktree-first runner",
      "attr.license": "apache-2.0",
      "attr.capabilities": ["loop", "worktree"],
    },
  },
  {
    id: "orch-gamma",
    kind: "orchestrator",
    name: "Gamma",
    attributes: {
      "attr.open-source": true,
      "attr.summary": "Full harness suite",
      "attr.license": "mit",
      "attr.capabilities": ["loop", "worktree", "harness"],
    },
  },
];

export const FIXTURE_ORCHESTRATOR_IDS = FIXTURE_ORCHESTRATORS.map(
  (row) => row.id,
);

export function getFixtureOrchestratorAttributeValue(
  row: OrchestratorRecord,
  attributeId: string,
): unknown {
  return row.attributes[attributeId];
}
