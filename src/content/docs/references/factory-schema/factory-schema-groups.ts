/**
 * Page-local information architecture for `/docs/references/factory-schema`.
 *
 * The published Factory schema is a flat bag of 100+ `$defs`. Rendering them in
 * pointer order is a dump: `AgentWorkerToolPolicy` lands next to `BundledFile`
 * with nothing to say why. This module partitions the splayed catalog into the
 * sections a reader actually navigates by — the core configuration, then each
 * top-level subject (workers, workstations, work) with the variant definitions
 * that only exist to describe it, then the primitives shared across all of them.
 *
 * Membership is by definition name, first matching spec wins, so the specs are
 * ordered most-specific-first: `Workstation*` is claimed before the broader
 * `Work*` sweep. Anything the specs do not claim falls into "Shared types" —
 * a new published definition appears in the right place or in the catch-all,
 * never silently dropped.
 *
 * Pure — no IO, no React. The same helper builds the rendered sections and the
 * right-rail table of contents, so headings and rail links cannot drift.
 */

import { buildUrlSafeAnchor } from "@/lib/references/reference-anchor-registry";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";

/** Section spec: how one group claims definitions and how it is titled. */
type FactorySchemaGroupSpec = {
  id: string;
  title: string;
  description: string;
  /**
   * Definition that heads the group. Sorted first so the subject a reader came
   * for sits above its variants instead of alphabetically among them.
   */
  lead?: string;
  /** Claimed when the definition name starts with any of these. */
  prefixes?: readonly string[];
  /** Claimed by exact name — for members whose name shares no prefix. */
  members?: readonly string[];
  /**
   * Claims everything no earlier spec took. Exactly one spec sets this, and it
   * must be last — it is what keeps a newly published definition on the page.
   */
  catchAll?: true;
};

/**
 * Ordered sections. Core configuration is rendered separately as the page's
 * first block; everything here follows it.
 *
 * `WorkPropagation`/`WorkPropagationMode` are listed on workstations rather
 * than left to the `Work*` sweep because `Workstation.workPropagation` is
 * their only referent.
 */
const FACTORY_SCHEMA_GROUP_SPECS: readonly FactorySchemaGroupSpec[] = [
  {
    id: "workers",
    title: "Workers",
    description:
      "The worker object and the provider, model, and tool variants that configure each worker type.",
    lead: "Worker",
    prefixes: [
      "Worker",
      "AgentWorker",
      "HostedWorker",
      "HostedLinearWorker",
      "ModelOperation",
    ],
    members: ["ReasoningEffort"],
  },
  {
    id: "workstations",
    title: "Workstations",
    description:
      "The workstation object and the scheduling, guard, routing, and IO variants that configure each workstation type.",
    lead: "Workstation",
    prefixes: ["Workstation"],
    members: ["ClassificationRoute", "WorkPropagation", "WorkPropagationMode"],
  },
  {
    id: "work",
    title: "Work types and messages",
    description:
      "Work type declarations, their state machines, and the content parts a work message carries between workstations.",
    lead: "WorkType",
    prefixes: ["Work"],
  },
  {
    id: "orchestrator",
    title: "Orchestrator",
    description:
      "How a factory advances work — the Petri-net default and the JavaScript orchestrator variants.",
    lead: "FactoryOrchestrator",
    prefixes: ["FactoryOrchestrator"],
  },
  {
    id: "invocation",
    title: "Invocation",
    description:
      "The signature a factory is called with, its parameter bindings, and the contract its return value satisfies.",
    lead: "FactoryInvocationSignature",
    prefixes: ["FactoryInvocation", "InvocationReturn"],
  },
  {
    id: "guards",
    title: "Guards and inputs",
    description:
      "Input type declarations and the guards that admit, reject, or route work into the factory.",
    lead: "FactoryGuard",
    prefixes: ["FactoryGuard", "InputGuard", "Input"],
    members: ["GuardMatchConfig"],
  },
  {
    id: "resources",
    title: "Resources",
    description:
      "Declared capacity, resource requirements, and the bundled files a factory ships with.",
    lead: "Resource",
    prefixes: ["Resource", "BundledFile"],
    members: ["RequiredTool"],
  },
  {
    id: "layout",
    title: "Layout",
    description:
      "Optional editor layout hints — node positions, groups, edges, and annotations. Not required to run a factory.",
    lead: "FactoryLayout",
    prefixes: ["FactoryLayout"],
  },
  {
    id: "shared",
    title: "Shared types",
    description: "Primitives referenced from more than one subject above.",
    catchAll: true,
  },
];

export type FactorySchemaGroup = {
  id: string;
  title: string;
  description: string;
  /** Stable in-page fragment for the section heading and its rail link. */
  anchor: string;
  definitions: readonly SchemaDefinitionModel[];
};

/** Fragment for a group heading. Deterministic — never a positional index. */
export function factorySchemaGroupAnchor(groupId: string): string {
  return `schema-group-${buildUrlSafeAnchor(groupId)}`;
}

/** Leaf name of a definition pointer: `/$defs/Worker` → `Worker`. */
export function factorySchemaDefinitionName(
  definition: SchemaDefinitionModel,
): string {
  const segments = definition.address.pointer
    .split("/")
    .filter((segment) => segment.length > 0);
  return segments.at(-1) ?? definition.address.pointer;
}

function claims(spec: FactorySchemaGroupSpec, name: string): boolean {
  if (spec.members?.includes(name) === true) {
    return true;
  }
  return (spec.prefixes ?? []).some((prefix) => name.startsWith(prefix));
}

/**
 * Partition splayed Factory definitions into ordered, titled sections.
 *
 * Groups that claim nothing are omitted rather than rendered empty. Within a
 * group the lead definition sorts first and the rest sort by name, so the order
 * is stable across builds regardless of catalog order.
 */
export function groupFactorySchemaDefinitions(
  definitions: readonly SchemaDefinitionModel[],
): FactorySchemaGroup[] {
  const unclaimed = new Map<string, SchemaDefinitionModel>();
  for (const definition of definitions) {
    unclaimed.set(factorySchemaDefinitionName(definition), definition);
  }

  const groups: FactorySchemaGroup[] = [];

  for (const spec of FACTORY_SCHEMA_GROUP_SPECS) {
    const claimed: SchemaDefinitionModel[] = [];

    for (const [name, definition] of unclaimed) {
      if (spec.catchAll === true || claims(spec, name)) {
        claimed.push(definition);
        unclaimed.delete(name);
      }
    }

    if (claimed.length === 0) {
      continue;
    }

    claimed.sort((a, b) => {
      const nameA = factorySchemaDefinitionName(a);
      const nameB = factorySchemaDefinitionName(b);
      if (nameA === spec.lead) {
        return -1;
      }
      if (nameB === spec.lead) {
        return 1;
      }
      return nameA.localeCompare(nameB);
    });

    groups.push({
      id: spec.id,
      title: spec.title,
      description: spec.description,
      anchor: factorySchemaGroupAnchor(spec.id),
      definitions: claimed,
    });
  }

  return groups;
}
