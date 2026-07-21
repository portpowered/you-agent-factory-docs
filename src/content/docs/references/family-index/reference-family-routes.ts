/**
 * Stable planned discoverability targets for the `/docs/references` family
 * index. Authored on the index so links stay present while parallel W11 page
 * slices land. This module does not author those page bodies.
 */
export const REFERENCE_FAMILY_DISCOVERABILITY_ROUTES = [
  {
    id: "api",
    href: "/docs/references/api",
  },
  {
    id: "events",
    href: "/docs/references/events",
  },
  {
    id: "factory-schema",
    href: "/docs/references/factory-schema",
  },
  {
    id: "system-config-schema",
    href: "/docs/references/system-config-schema",
  },
  {
    id: "mock-workers-schema",
    href: "/docs/references/mock-workers-schema",
  },
  {
    id: "cli",
    href: "/docs/references/cli",
  },
  {
    id: "mcp",
    href: "/docs/references/mcp-reference",
  },
  {
    id: "javascript-runtime",
    href: "/docs/references/javascript-runtime",
  },
] as const;

export type ReferenceFamilyDiscoverabilityRoute =
  (typeof REFERENCE_FAMILY_DISCOVERABILITY_ROUTES)[number];

export const REFERENCE_FAMILY_INDEX_REGISTRY_ID = "reference.references";
