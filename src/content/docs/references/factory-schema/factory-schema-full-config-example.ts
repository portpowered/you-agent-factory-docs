/**
 * Authored full Factory configuration JSON example for
 * `/docs/references/factory-schema`.
 *
 * Static docs override aligned with the hermetic factories/configuration
 * minimal sample (`workTypes` / `workers` / `workstations`). Keys stay within
 * the published Factory schema field set — no invented upstream-only fields.
 */

import type { SchemaExampleInput } from "@/features/references/schema";

/**
 * Hermetic minimal Factory configuration — same shape as
 * `src/content/docs/factories/configuration/page.mdx` § minimal-factory.
 */
export const FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE = {
  workTypes: [
    {
      name: "task",
      states: [
        { name: "init", type: "INITIAL" },
        { name: "complete", type: "TERMINAL" },
        { name: "failed", type: "FAILED" },
      ],
    },
  ],
  workers: [{ name: "processor" }],
  workstations: [
    {
      name: "process",
      worker: "processor",
      inputs: [{ workType: "task", state: "init" }],
      outputs: [{ workType: "task", state: "complete" }],
      onFailure: { workType: "task", state: "failed" },
    },
  ],
} as const;

export const FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID =
  "full-factory-configuration";

/**
 * Single authored `exampleInputs` override for SchemaReference on the Factory
 * schema page. Production mounts pass this so the root definition shows one
 * copyable full configuration JSON example near Schema Lookup.
 */
export const FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_INPUTS: readonly SchemaExampleInput[] =
  [
    {
      id: FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE_ID,
      value: FACTORY_SCHEMA_FULL_CONFIG_EXAMPLE,
      origin: "authored",
      language: "json",
      label: "Full Factory configuration",
    },
  ];
