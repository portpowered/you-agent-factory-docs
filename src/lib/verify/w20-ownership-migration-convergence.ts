/**
 * W20 story 010: plan §9 / §11 ownership map + W18 migration ledger closure
 * convergence.
 *
 * Owns the reviewer-followable ownership/test-surface record for every public
 * page in plan §9 and every shared component in plan §11, and catalogues the
 * W18 migration ledger closure suites that must stay fully closed on tip.
 * Does not invent product pages, unpublished schemas, or reopen W18 mechanism
 * design.
 */

import {
  DOCUMENTATION_ROUTE_MIGRATION_LEDGER,
  DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
  isDocumentationRouteMigrationLedgerFullyClosed,
  listOpenDocumentationRouteMigrationRows,
} from "@/lib/seo/documentation-route-migration";

/** Owning workstream ids allowed on the ownership map. */
export type W20OwnershipWorkstream =
  | "W03"
  | "W04"
  | "W06"
  | "W07"
  | "W08"
  | "W09"
  | "W10"
  | "W11"
  | "W12"
  | "W13"
  | "W14"
  | "W15"
  | "W16"
  | "W17"
  | "W18"
  | "W19"
  | "W20"
  | "reuse";

export type W20OwnershipMigrationGateFamily =
  | "plan-section-9-page-ownership"
  | "plan-section-11-component-ownership"
  | "ownership-test-surface-presence"
  | "migration-ledger-closure"
  | "no-competing-old-canonicals";

export type W20OwnershipPageRow = {
  /** Plan §9 public route. */
  route: `/${string}`;
  /** Plan subsection that lists the route. */
  planSection: "9.1" | "9.2" | "9.3" | "9.4";
  /** Owning W00–W19 workstream (or W20 for convergence-only). */
  owner: W20OwnershipWorkstream;
  /** Repo-relative focused test surface reviewers can follow. */
  testSurface: string;
};

export type W20OwnershipComponentRow = {
  /** Plan §11 component / infrastructure name. */
  name: string;
  /** Plan subsection that lists the component. */
  planSection:
    | "11.1"
    | "11.2"
    | "11.3"
    | "11.4"
    | "11.5"
    | "11.6"
    | "11.7"
    | "11.8";
  /** Owning workstream, or `reuse` for existing site/package primitives. */
  owner: W20OwnershipWorkstream;
  /** Primary implementation path (file or ownership root). */
  implementation: string;
  /** Repo-relative focused test surface reviewers can follow. */
  testSurface: string;
};

export type W20OwnershipMigrationSuiteEntry = {
  /** Repo-relative bun test path. */
  path: string;
  families: readonly W20OwnershipMigrationGateFamily[];
};

/**
 * Plan §9 public page inventory → owning workstream + focused test surface.
 * Index routes are included even when nested leaf lists omit them.
 */
export const W20_PLAN_SECTION_9_PAGE_OWNERSHIP = [
  // 9.1 Reference collection
  {
    route: "/docs/references",
    planSection: "9.1",
    owner: "W11",
    testSurface:
      "src/content/docs/references/family-index/references-family-index.test.tsx",
  },
  {
    route: "/docs/references/api",
    planSection: "9.1",
    owner: "W11",
    testSurface: "src/content/docs/references/api/api-page.test.tsx",
  },
  {
    route: "/docs/references/factory-schema",
    planSection: "9.1",
    owner: "W11",
    testSurface:
      "src/content/docs/references/factory-schema/factory-schema-page.test.tsx",
  },
  {
    route: "/docs/references/system-config-schema",
    planSection: "9.1",
    owner: "W11",
    testSurface:
      "src/content/docs/references/system-config-schema/system-config-schema-page.test.tsx",
  },
  {
    route: "/docs/references/mock-workers-schema",
    planSection: "9.1",
    owner: "W11",
    testSurface:
      "src/content/docs/references/mock-workers-schema/mock-workers-schema-page.test.tsx",
  },
  {
    route: "/docs/references/mcp-reference",
    planSection: "9.1",
    owner: "W11",
    testSurface: "src/content/docs/references/mcp-reference/mcp-page.test.tsx",
  },
  {
    route: "/docs/references/cli",
    planSection: "9.1",
    owner: "W11",
    testSurface: "src/content/docs/references/cli/cli-page.test.tsx",
  },
  {
    route: "/docs/references/javascript-runtime",
    planSection: "9.1",
    owner: "W11",
    testSurface:
      "src/content/docs/references/javascript-runtime/javascript-runtime-page.test.tsx",
  },
  {
    route: "/docs/references/events",
    planSection: "9.1",
    owner: "W11",
    testSurface: "src/content/docs/references/events/events-page.test.tsx",
  },
  // 9.2 Factory pages
  {
    route: "/docs/factories",
    planSection: "9.2",
    owner: "W12",
    testSurface: "src/content/docs/factories/index/factories-index.test.tsx",
  },
  {
    route: "/docs/factories/configuration",
    planSection: "9.2",
    owner: "W12",
    testSurface:
      "src/content/docs/factories/configuration/configuration-page.test.tsx",
  },
  {
    route: "/docs/factories/global-configuration",
    planSection: "9.2",
    owner: "W12",
    testSurface:
      "src/content/docs/factories/global-configuration/global-configuration-page.test.tsx",
  },
  {
    route: "/docs/factories/packaged",
    planSection: "9.2",
    owner: "W12",
    testSurface: "src/content/docs/factories/packaged/packaged-page.test.tsx",
  },
  {
    route: "/docs/factories/dynamic-workflows",
    planSection: "9.2",
    owner: "W12",
    testSurface:
      "src/content/docs/factories/dynamic-workflows/dynamic-workflows-page.test.tsx",
  },
  {
    route: "/docs/factories/sessions",
    planSection: "9.2",
    owner: "W12",
    testSurface: "src/content/docs/factories/sessions/sessions-page.test.tsx",
  },
  // 9.3 Worker pages
  {
    route: "/docs/workers",
    planSection: "9.3",
    owner: "W13",
    testSurface: "src/content/docs/workers/workers-family-index.test.tsx",
  },
  {
    route: "/docs/workers/agent",
    planSection: "9.3",
    owner: "W13",
    testSurface: "src/content/docs/workers/agent/agent-worker-page.test.tsx",
  },
  {
    route: "/docs/workers/inference",
    planSection: "9.3",
    owner: "W13",
    testSurface:
      "src/content/docs/workers/inference/inference-worker-page.test.tsx",
  },
  {
    route: "/docs/workers/script",
    planSection: "9.3",
    owner: "W13",
    testSurface: "src/content/docs/workers/script/script-worker-page.test.tsx",
  },
  {
    route: "/docs/workers/poller",
    planSection: "9.3",
    owner: "W13",
    testSurface: "src/content/docs/workers/poller/poller-worker-page.test.tsx",
  },
  {
    route: "/docs/workers/model",
    planSection: "9.3",
    owner: "W13",
    testSurface: "src/content/docs/workers/model/model-worker-page.test.tsx",
  },
  {
    route: "/docs/workers/hosted",
    planSection: "9.3",
    owner: "W13",
    testSurface: "src/content/docs/workers/hosted/hosted-worker-page.test.tsx",
  },
  {
    route: "/docs/workers/mock",
    planSection: "9.3",
    owner: "W13",
    testSurface: "src/content/docs/workers/mock/mock-worker-page.test.tsx",
  },
  // 9.4 Workstation pages
  {
    route: "/docs/workstations",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/workstations-family-index.test.tsx",
  },
  {
    route: "/docs/workstations/standard",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/standard/standard-behavior-page.test.tsx",
  },
  {
    route: "/docs/workstations/repeater",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/repeater/repeater-behavior-page.test.tsx",
  },
  {
    route: "/docs/workstations/cron",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/cron/cron-behavior-page.test.tsx",
  },
  {
    route: "/docs/workstations/poller",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/poller/poller-behavior-page.test.tsx",
  },
  {
    route: "/docs/workstations/inference-run",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/inference-run/inference-run-type-page.test.tsx",
  },
  {
    route: "/docs/workstations/agent-run",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/agent-run/agent-run-type-page.test.tsx",
  },
  {
    route: "/docs/workstations/script-run",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/script-run/script-run-type-page.test.tsx",
  },
  {
    route: "/docs/workstations/poller-run",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/poller-run/poller-run-type-page.test.tsx",
  },
  {
    route: "/docs/workstations/model-workstation",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/model-workstation/model-workstation-type-page.test.tsx",
  },
  {
    route: "/docs/workstations/model-invoke",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/model-invoke/model-invoke-type-page.test.tsx",
  },
  {
    route: "/docs/workstations/logical-move",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/logical-move/logical-move-type-page.test.tsx",
  },
  {
    route: "/docs/workstations/classifier",
    planSection: "9.4",
    owner: "W14",
    testSurface:
      "src/content/docs/workstations/classifier/classifier-type-page.test.tsx",
  },
] as const satisfies readonly W20OwnershipPageRow[];

/**
 * Plan §11 component / infrastructure inventory → owner + implementation +
 * focused test surface. §11.8 reuse rows map existing site/package primitives
 * rather than inventing page-local forks.
 */
export const W20_PLAN_SECTION_11_COMPONENT_OWNERSHIP = [
  // 11.1 Contract acquisition and validation
  {
    name: "ApiPackageArtifactResolver",
    planSection: "11.1",
    owner: "W03",
    implementation: "src/lib/references/api-package-artifact-resolver.ts",
    testSurface: "src/lib/references/api-package-artifact-resolver.test.ts",
  },
  {
    name: "ApiPackageManifestValidator",
    planSection: "11.1",
    owner: "W03",
    implementation: "src/lib/references/api-package-manifest-membership.ts",
    testSurface: "src/lib/references/api-package-manifest-membership.test.ts",
  },
  {
    name: "ReferenceContractVersionGate",
    planSection: "11.1",
    owner: "W03",
    implementation: "src/lib/references/api-package-format-version-gate.ts",
    testSurface: "src/lib/references/api-package-format-version-gate.test.ts",
  },
  {
    name: "ReferenceArtifactHashLedger",
    planSection: "11.1",
    owner: "W03",
    implementation: "src/lib/references/api-package-consumed-hash-ledger.ts",
    testSurface: "src/lib/references/api-package-consumed-hash-ledger.test.ts",
  },
  {
    name: "OpenApiContractLoader",
    planSection: "11.1",
    owner: "W03",
    implementation: "src/components/references/api/load-openapi-artifact.ts",
    testSurface: "src/components/references/api/single-page-projection.test.ts",
  },
  {
    name: "JsonSchemaContractLoader",
    planSection: "11.1",
    owner: "W03",
    implementation: "src/lib/references/normalize-json-schema-artifact.ts",
    testSurface: "src/lib/references/normalize-json-schema-artifact.test.ts",
  },
  {
    name: "ReferenceRuntimeBuilder",
    planSection: "11.1",
    owner: "W03",
    implementation: "src/lib/references/normalize-family-artifacts.ts",
    testSurface: "src/lib/references/normalize-family-artifacts.test.ts",
  },
  // 11.2 Shared reference model and addressing
  {
    name: "ReferenceItem",
    planSection: "11.2",
    owner: "W04",
    implementation: "src/lib/references/reference-item.ts",
    testSurface: "src/lib/references/reference-item.test.ts",
  },
  {
    name: "SchemaAddress",
    planSection: "11.2",
    owner: "W04",
    implementation: "src/lib/references/schema-model.ts",
    testSurface: "src/lib/references/schema-model.test.ts",
  },
  {
    name: "SchemaDefinitionModel",
    planSection: "11.2",
    owner: "W04",
    implementation: "src/lib/references/schema-model.ts",
    testSurface: "src/lib/references/schema-model.test.ts",
  },
  {
    name: "SchemaFieldModel",
    planSection: "11.2",
    owner: "W04",
    implementation: "src/lib/references/schema-model.ts",
    testSurface: "src/lib/references/schema-model.test.ts",
  },
  {
    name: "ReferenceAnchorRegistry",
    planSection: "11.2",
    owner: "W04",
    implementation: "src/lib/references/reference-anchor-registry.ts",
    testSurface: "src/lib/references/reference-anchor-registry.test.ts",
  },
  {
    name: "ReferenceCrossLinkResolver",
    planSection: "11.2",
    owner: "W04",
    implementation: "src/lib/references/reference-cross-link-resolver.ts",
    testSurface: "src/lib/references/reference-cross-link-resolver.test.ts",
  },
  {
    name: "ReferenceSearchDocumentBuilder",
    planSection: "11.2",
    owner: "W16",
    implementation: "src/lib/references/reference-search-projection.ts",
    testSurface: "src/lib/references/reference-search-projection.test.ts",
  },
  // 11.3 Schema UI
  {
    name: "SchemaReference",
    planSection: "11.3",
    owner: "W07",
    implementation: "src/components/references/schema/schema-reference.tsx",
    testSurface: "src/components/references/schema/schema-reference.test.tsx",
  },
  {
    name: "SchemaVariantReference",
    planSection: "11.3",
    owner: "W07",
    implementation:
      "src/components/references/schema/schema-variant-reference.tsx",
    testSurface:
      "src/components/references/schema/schema-variant-reference.test.tsx",
  },
  {
    name: "SchemaDefinition",
    planSection: "11.3",
    owner: "W07",
    implementation: "src/components/references/schema/schema-definition.tsx",
    testSurface: "src/components/references/schema/schema-definition.test.tsx",
  },
  {
    name: "SchemaFieldTree",
    planSection: "11.3",
    owner: "W07",
    implementation: "src/components/references/schema/schema-field-tree.tsx",
    testSurface: "src/components/references/schema/schema-field-tree.test.tsx",
  },
  {
    name: "SchemaFieldRow",
    planSection: "11.3",
    owner: "W07",
    implementation: "src/components/references/schema/schema-field-row.tsx",
    testSurface:
      "src/components/references/schema/schema-field-metadata.test.tsx",
  },
  {
    name: "SchemaTypeBadge",
    planSection: "11.3",
    owner: "W07",
    implementation: "src/components/references/schema/schema-type-badge.tsx",
    testSurface:
      "src/components/references/schema/schema-field-metadata.test.tsx",
  },
  {
    name: "SchemaRequiredBadge",
    planSection: "11.3",
    owner: "W07",
    implementation:
      "src/components/references/schema/schema-required-badge.tsx",
    testSurface:
      "src/components/references/schema/schema-field-metadata.test.tsx",
  },
  {
    name: "SchemaConstraintList",
    planSection: "11.3",
    owner: "W07",
    implementation:
      "src/components/references/schema/schema-constraint-list.tsx",
    testSurface:
      "src/components/references/schema/schema-field-metadata.test.tsx",
  },
  {
    name: "SchemaDefaultValue",
    planSection: "11.3",
    owner: "W07",
    implementation: "src/components/references/schema/schema-default-value.tsx",
    testSurface:
      "src/components/references/schema/schema-field-metadata.test.tsx",
  },
  {
    name: "SchemaComposition",
    planSection: "11.3",
    owner: "W07",
    implementation: "src/components/references/schema/schema-composition.tsx",
    testSurface: "src/components/references/schema/schema-composition.test.tsx",
  },
  {
    name: "SchemaRefLink",
    planSection: "11.3",
    owner: "W07",
    implementation: "src/components/references/schema/schema-ref-link.tsx",
    testSurface: "src/components/references/schema/schema-definition.test.tsx",
  },
  {
    name: "SchemaExamplePanel",
    planSection: "11.3",
    owner: "W07",
    implementation: "src/components/references/schema/schema-example-panel.tsx",
    testSurface:
      "src/components/references/schema/schema-example-panel.test.tsx",
  },
  {
    name: "SchemaBreadcrumb",
    planSection: "11.3",
    owner: "W07",
    implementation: "src/components/references/schema/schema-breadcrumb.tsx",
    testSurface: "src/components/references/schema/schema-surface.test.tsx",
  },
  {
    name: "SchemaFilter",
    planSection: "11.3",
    owner: "W07",
    implementation: "src/components/references/schema/schema-filter.tsx",
    testSurface: "src/components/references/schema/schema-filter.test.tsx",
  },
  // 11.4 Unified API UI
  {
    name: "ApiReferencePage",
    planSection: "11.4",
    owner: "W08",
    implementation: "src/components/references/api/api-surface.tsx",
    testSurface: "src/components/references/api/api-surface.test.tsx",
  },
  {
    name: "ApiOperationNavigator",
    planSection: "11.4",
    owner: "W08",
    implementation: "src/components/references/api/api-operation-navigator.tsx",
    testSurface:
      "src/components/references/api/api-operation-navigation.test.tsx",
  },
  {
    name: "ApiOperationSection",
    planSection: "11.4",
    owner: "W08",
    implementation: "src/components/references/api/api-operation-section.tsx",
    testSurface: "src/components/references/api/api-operation-section.test.tsx",
  },
  {
    name: "ApiMethodBadge",
    planSection: "11.4",
    owner: "W08",
    implementation: "src/components/references/api/api-method-badge.tsx",
    testSurface: "src/components/references/api/api-operation-section.test.tsx",
  },
  {
    name: "ApiExamplePanel",
    planSection: "11.4",
    owner: "W08",
    implementation: "src/components/references/api/api-operation-examples.tsx",
    testSurface: "src/components/references/api/api-theme-code-copy.test.tsx",
  },
  {
    name: "ApiResponseMediaType",
    planSection: "11.4",
    owner: "W08",
    implementation: "src/components/references/api/api-response-media-type.tsx",
    testSurface: "src/components/references/api/api-operation-section.test.tsx",
  },
  {
    name: "ApiSchemaLink",
    planSection: "11.4",
    owner: "W08",
    implementation: "src/components/references/api/api-operation-section.tsx",
    testSurface: "src/components/references/api/api-operation-anchors.test.tsx",
  },
  {
    name: "ApiReferenceMobileNavigator",
    planSection: "11.4",
    owner: "W08",
    implementation:
      "src/components/references/api/api-reference-mobile-navigator.tsx",
    testSurface:
      "src/components/references/api/api-operation-navigation.test.tsx",
  },
  {
    name: "ApiReferenceHashController",
    planSection: "11.4",
    owner: "W08",
    implementation:
      "src/components/references/api/api-reference-hash-controller.tsx",
    testSurface: "src/components/references/api/api-operation-anchors.test.tsx",
  },
  // 11.5 Event-stream UI
  {
    name: "EventStreamOperationSummary",
    planSection: "11.5",
    owner: "W09",
    implementation:
      "src/components/references/events/event-stream-operation-summary.tsx",
    testSurface:
      "src/components/references/events/event-stream-operations.test.tsx",
  },
  {
    name: "EventStreamLifecycle",
    planSection: "11.5",
    owner: "W09",
    implementation:
      "src/components/references/events/event-stream-lifecycle.tsx",
    testSurface:
      "src/components/references/events/event-reconnect-lifecycle.test.tsx",
  },
  {
    name: "EventReconnectContract",
    planSection: "11.5",
    owner: "W09",
    implementation:
      "src/components/references/events/event-reconnect-contract.tsx",
    testSurface:
      "src/components/references/events/event-reconnect-lifecycle.test.tsx",
  },
  {
    name: "EventIdentityHandshake",
    planSection: "11.5",
    owner: "W09",
    implementation:
      "src/components/references/events/event-identity-handshake.tsx",
    testSurface:
      "src/components/references/events/event-reconnect-lifecycle.test.tsx",
  },
  {
    name: "SseFrameExample",
    planSection: "11.5",
    owner: "W09",
    implementation: "src/components/references/events/sse-frame-example.tsx",
    testSurface:
      "src/components/references/events/sse-static-examples.test.tsx",
  },
  {
    name: "EventEnvelopeReference",
    planSection: "11.5",
    owner: "W09",
    implementation:
      "src/components/references/events/event-envelope-reference.tsx",
    testSurface:
      "src/components/references/events/factory-event-catalog.test.tsx",
  },
  {
    name: "EventPayloadCatalog",
    planSection: "11.5",
    owner: "W09",
    implementation:
      "src/components/references/events/event-payload-catalog.tsx",
    testSurface:
      "src/components/references/events/factory-event-catalog.test.tsx",
  },
  {
    name: "EventPayloadVariant",
    planSection: "11.5",
    owner: "W09",
    implementation:
      "src/components/references/events/event-payload-variant.tsx",
    testSurface:
      "src/components/references/events/factory-event-catalog.test.tsx",
  },
  {
    name: "EventDiscriminatorMap",
    planSection: "11.5",
    owner: "W09",
    implementation:
      "src/components/references/events/event-discriminator-map.tsx",
    testSurface:
      "src/components/references/events/factory-event-catalog.test.tsx",
  },
  {
    name: "ResponseEventMatrix",
    planSection: "11.5",
    owner: "W09",
    implementation:
      "src/components/references/events/response-event-matrix.tsx",
    testSurface:
      "src/components/references/events/factory-response-event-catalog.test.tsx",
  },
  {
    name: "EventCanonicalityBadge",
    planSection: "11.5",
    owner: "W09",
    implementation:
      "src/components/references/events/event-canonicality-badge.tsx",
    testSurface:
      "src/components/references/events/event-stream-operations.test.tsx",
  },
  // 11.6 Family-specific reference UI
  {
    name: "ReferencesIndex",
    planSection: "11.6",
    owner: "W11",
    implementation:
      "src/content/docs/references/family-index/ReferencesFamilyIndex.tsx",
    testSurface:
      "src/content/docs/references/family-index/references-family-index.test.tsx",
  },
  {
    name: "McpToolReference",
    planSection: "11.6",
    owner: "W10",
    implementation: "src/components/references/mcp/McpToolReference.tsx",
    testSurface: "src/components/references/mcp/mcp-tool-reference.test.tsx",
  },
  {
    name: "CliCommandReference",
    planSection: "11.6",
    owner: "W10",
    implementation: "src/components/references/cli/CliCommandReference.tsx",
    testSurface: "src/components/references/cli/cli-command-reference.test.tsx",
  },
  {
    name: "CliCapabilityNotice",
    planSection: "11.6",
    owner: "W10",
    implementation: "src/components/references/cli/CliCapabilityNotice.tsx",
    testSurface: "src/components/references/cli/cli-command-reference.test.tsx",
  },
  {
    name: "JavaScriptSymbolReference",
    planSection: "11.6",
    owner: "W10",
    implementation:
      "src/components/references/javascript/JavaScriptSymbolReference.tsx",
    testSurface:
      "src/components/references/javascript/javascript-symbol-reference.test.tsx",
  },
  {
    name: "ContractSourceBadge",
    planSection: "11.6",
    owner: "W10",
    implementation: "src/components/references/shared/ContractSourceBadge.tsx",
    testSurface: "src/components/references/shared/reference-chrome.test.tsx",
  },
  {
    name: "ReferenceEmptyState",
    planSection: "11.6",
    owner: "W10",
    implementation: "src/components/references/shared/ReferenceEmptyState.tsx",
    testSurface: "src/components/references/shared/reference-chrome.test.tsx",
  },
  {
    name: "ReferenceErrorState",
    planSection: "11.6",
    owner: "W10",
    implementation: "src/components/references/shared/ReferenceErrorState.tsx",
    testSurface: "src/components/references/shared/reference-chrome.test.tsx",
  },
  // 11.7 Variant overlay infrastructure
  {
    name: "FactoryVariantOverlaySchema",
    planSection: "11.7",
    owner: "W06",
    implementation:
      "src/lib/references/overlays/factory-variant-overlay-schema.ts",
    testSurface:
      "src/lib/references/overlays/factory-variant-overlay-schema.test.ts",
  },
  {
    name: "FactoryVariantOverlayRegistry",
    planSection: "11.7",
    owner: "W06",
    implementation:
      "src/lib/references/overlays/factory-variant-overlay-registry.ts",
    testSurface:
      "src/lib/references/overlays/factory-variant-overlay-registry.test.ts",
  },
  {
    name: "FactoryVariantOverlayValidator",
    planSection: "11.7",
    owner: "W06",
    implementation:
      "src/lib/references/overlays/factory-variant-overlay-validator.ts",
    testSurface:
      "src/lib/references/overlays/factory-variant-overlay-validator.test.ts",
  },
  {
    name: "FactoryVariantCompatibilityMatrix",
    planSection: "11.7",
    owner: "W06",
    implementation:
      "src/lib/references/overlays/factory-variant-compatibility-matrix.ts",
    testSurface:
      "src/lib/references/overlays/factory-variant-compatibility-matrix.test.ts",
  },
  {
    name: "FactoryVariantSchemaEmbed",
    planSection: "11.7",
    owner: "W06",
    implementation:
      "src/components/references/schema/schema-variant-reference.tsx",
    testSurface:
      "src/components/references/schema/schema-variant-reference.test.tsx",
  },
  // 11.8 Existing shared components to reuse (site / package wrappers)
  {
    name: "DataTable",
    planSection: "11.8",
    owner: "reuse",
    implementation: "src/features/factory-ui/data-display.ts",
    testSurface: "src/features/factory-ui/data-display.test.tsx",
  },
  {
    name: "CodePanel",
    planSection: "11.8",
    owner: "reuse",
    implementation: "src/features/docs/components/DocsCodeBlock.tsx",
    testSurface: "src/features/docs/components/DocsCodeBlock.test.tsx",
  },
  {
    name: "docs-shell-and-breadcrumbs",
    planSection: "11.8",
    owner: "reuse",
    implementation: "src/features/layout/docs-header.tsx",
    testSurface: "src/features/layout/docs-header.test.tsx",
  },
  {
    name: "localized-Section-and-T",
    planSection: "11.8",
    owner: "reuse",
    implementation: "src/features/docs/components/Section.tsx",
    testSurface: "src/features/docs/components/Section.test.tsx",
  },
  {
    name: "related-docs-and-tags",
    planSection: "11.8",
    owner: "reuse",
    implementation: "src/features/docs/components/TagResourceList.tsx",
    testSurface: "src/features/docs/components/TagResourceList.test.tsx",
  },
  {
    name: "code-copy-behavior",
    planSection: "11.8",
    owner: "reuse",
    implementation: "src/features/docs/components/DocsCodeCopyButton.tsx",
    testSurface: "src/features/docs/components/DocsCodeCopyButton.test.tsx",
  },
  {
    name: "search-dialog-results",
    planSection: "11.8",
    owner: "reuse",
    implementation: "src/features/docs/search/SearchTrigger.tsx",
    testSurface: "src/features/docs/search/SearchTrigger.test.tsx",
  },
] as const satisfies readonly W20OwnershipComponentRow[];

/**
 * W18 migration ledger closure suites that must stay green on the converged
 * tip (fully closed §10 rows; no competing old canonicals).
 */
export const W20_OWNERSHIP_MIGRATION_SUITE_ENTRIES = [
  {
    path: "src/lib/seo/documentation-route-migration.test.ts",
    families: ["migration-ledger-closure"],
  },
  {
    path: "src/lib/seo/documentation-route-migration-closure.test.tsx",
    families: ["migration-ledger-closure", "no-competing-old-canonicals"],
  },
  {
    path: "src/lib/seo/documentation-route-migration-canonical.test.ts",
    families: ["no-competing-old-canonicals"],
  },
  {
    path: "src/lib/seo/documentation-route-migration-links.test.tsx",
    families: ["no-competing-old-canonicals"],
  },
] as const satisfies readonly W20OwnershipMigrationSuiteEntry[];

export const W20_OWNERSHIP_MIGRATION_REQUIRED_TEST_PATHS =
  W20_OWNERSHIP_MIGRATION_SUITE_ENTRIES.map((entry) => entry.path);

export const W20_OWNERSHIP_MIGRATION_REQUIRED_FAMILIES = [
  "plan-section-9-page-ownership",
  "plan-section-11-component-ownership",
  "ownership-test-surface-presence",
  "migration-ledger-closure",
  "no-competing-old-canonicals",
] as const satisfies readonly W20OwnershipMigrationGateFamily[];

export const W20_OWNERSHIP_MIGRATION_SUITE_COMMAND =
  "make test-w20-ownership-migration";

export const W20_PLAN_SECTION_9_EXPECTED_PAGE_COUNT =
  W20_PLAN_SECTION_9_PAGE_OWNERSHIP.length;

export const W20_PLAN_SECTION_11_EXPECTED_COMPONENT_COUNT =
  W20_PLAN_SECTION_11_COMPONENT_OWNERSHIP.length;

export type W20OwnershipMapEvaluation = {
  pageCount: number;
  componentCount: number;
  orphanPageRoutes: string[];
  orphanComponentNames: string[];
  missingOwners: string[];
  missingTestSurfaces: string[];
  duplicatePageRoutes: string[];
  duplicateComponentNames: string[];
  migrationLedgerFullyClosed: boolean;
  openMigrationRows: number;
  migrationLedgerRowCount: number;
  expectedMigrationLedgerRowCount: number;
  complete: boolean;
};

/**
 * Pure ownership-map + migration-ledger evaluation used by catalog proofs.
 * Does not touch the filesystem — callers assert path existence separately.
 */
export function evaluateOwnershipMigrationConvergence(input?: {
  pages?: readonly W20OwnershipPageRow[];
  components?: readonly W20OwnershipComponentRow[];
}): W20OwnershipMapEvaluation {
  const pages = input?.pages ?? W20_PLAN_SECTION_9_PAGE_OWNERSHIP;
  const components =
    input?.components ?? W20_PLAN_SECTION_11_COMPONENT_OWNERSHIP;

  const pageRoutes = pages.map((row) => row.route);
  const componentNames = components.map((row) => row.name);

  const duplicatePageRoutes = duplicates(pageRoutes);
  const duplicateComponentNames = duplicates(componentNames);

  const missingOwners = [
    ...pages.filter((row) => !row.owner).map((row) => `page:${row.route}`),
    ...components
      .filter((row) => !row.owner)
      .map((row) => `component:${row.name}`),
  ];

  const missingTestSurfaces = [
    ...pages
      .filter((row) => !row.testSurface)
      .map((row) => `page:${row.route}`),
    ...components
      .filter((row) => !row.testSurface)
      .map((row) => `component:${row.name}`),
  ];

  const openMigrationRows = listOpenDocumentationRouteMigrationRows().length;
  const migrationLedgerFullyClosed =
    isDocumentationRouteMigrationLedgerFullyClosed();
  const migrationLedgerRowCount = DOCUMENTATION_ROUTE_MIGRATION_LEDGER.length;

  const complete =
    pages.length > 0 &&
    components.length > 0 &&
    duplicatePageRoutes.length === 0 &&
    duplicateComponentNames.length === 0 &&
    missingOwners.length === 0 &&
    missingTestSurfaces.length === 0 &&
    migrationLedgerFullyClosed &&
    openMigrationRows === 0 &&
    migrationLedgerRowCount ===
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT;

  return {
    pageCount: pages.length,
    componentCount: components.length,
    orphanPageRoutes: [],
    orphanComponentNames: [],
    missingOwners,
    missingTestSurfaces,
    duplicatePageRoutes,
    duplicateComponentNames,
    migrationLedgerFullyClosed,
    openMigrationRows,
    migrationLedgerRowCount,
    expectedMigrationLedgerRowCount:
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    complete,
  };
}

export function listW20OwnershipMigrationCoveredFamilies(): W20OwnershipMigrationGateFamily[] {
  const covered = new Set<W20OwnershipMigrationGateFamily>([
    "plan-section-9-page-ownership",
    "plan-section-11-component-ownership",
    "ownership-test-surface-presence",
  ]);
  for (const entry of W20_OWNERSHIP_MIGRATION_SUITE_ENTRIES) {
    for (const family of entry.families) {
      covered.add(family);
    }
  }
  return [...covered].sort();
}

export function listPlanSection9Routes(): string[] {
  return W20_PLAN_SECTION_9_PAGE_OWNERSHIP.map((row) => row.route);
}

export function listPlanSection11ComponentNames(): string[] {
  return W20_PLAN_SECTION_11_COMPONENT_OWNERSHIP.map((row) => row.name);
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      dupes.add(value);
    }
    seen.add(value);
  }
  return [...dupes].sort();
}
