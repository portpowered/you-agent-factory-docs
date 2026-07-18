/**
 * W08 production Fumadocs OpenAPI dependency pin + upgrade-risk notes.
 *
 * This module is the production-pin owner for the unified API reference
 * renderer. It promotes the compatible W01 temporary selection
 * (`fumadocs-openapi@10.10.3` on Fumadocs 16.9) into an explicit production
 * pin set. `@fumadocs/asyncapi` is intentionally excluded: W02 selected hybrid
 * SSE placement, so API-page summaries own HTTP transport semantics and link
 * toward `/docs/references/events` without requiring an AsyncAPI renderer.
 */

/** Production ownership status for the OpenAPI renderer dependency set. */
export const OPENAPI_PRODUCTION_PIN_STATUS = "production" as const;

/** Compatible with the current fumadocs-core/ui 16.9-line stack. */
export const OPENAPI_PRODUCTION_SELECTED_VERSION = "10.10.3" as const;

/**
 * Production package names that belong to the W08 OpenAPI renderer pin set.
 * Keep this list explicit so residual spike packages cannot be mistaken for
 * production pins.
 */
export const OPENAPI_PRODUCTION_DEPENDENCY_SET = [
  "fumadocs-openapi",
  "fumadocs-core",
  "fumadocs-ui",
  "@scalar/api-client-react",
] as const;

export type OpenApiProductionDependencyName =
  (typeof OPENAPI_PRODUCTION_DEPENDENCY_SET)[number];

/**
 * Coordinated upgrade candidate: bump fumadocs-openapi with fumadocs-core/ui
 * together. Do not install 11.2 on the current 16.9 stack.
 */
export const OPENAPI_PRODUCTION_UPGRADE_CANDIDATE = {
  fumadocsOpenapi: "11.2.2",
  fumadocsCore: "16.10.7",
  fumadocsUi: "16.10.7",
} as const;

/** Stack versions recorded when the W08 production pin was chosen. */
export const OPENAPI_PRODUCTION_RECORDED_STACK = {
  fumadocsOpenapi: OPENAPI_PRODUCTION_SELECTED_VERSION,
  fumadocsCore: "16.9.3",
  fumadocsUi: "16.9.3",
  fumadocsMdx: "15.0.10",
  next: "16.2.7",
  react: "19.2.7",
  reactDom: "19.2.7",
  scalarApiClientReact: "^2.0.20",
  youAgentFactoryApi: "0.0.0",
} as const;

/**
 * Explicit non-pin for `@fumadocs/asyncapi`. Hybrid API-page summaries do not
 * need AsyncAPI UI; W09 owns the event envelope/payload catalog.
 *
 * Residual `package.json` entries for merged W02 spike evidence modules are
 * not part of this production pin set and must not be imported from
 * `src/components/references/api/`.
 */
export const OPENAPI_PRODUCTION_ASYNCAPI_POLICY = {
  packageName: "@fumadocs/asyncapi",
  pinnedForProduction: false,
  requiredForApiPageSummaries: false,
  justification:
    "W02 selected hybrid SSE placement: the API page owns HTTP transport/reconnect/cursor/handshake/dual-Accept/replay semantics and summarizes streams with links toward /docs/references/events. The full event corpus is W09. No API-page summary requirement strictly needs @fumadocs/asyncapi, so W08 does not pin it for production.",
} as const;

export const OPENAPI_PRODUCTION_PEER_NOTES = {
  selected: {
    fumadocsOpenapi: OPENAPI_PRODUCTION_SELECTED_VERSION,
    requiresFumadocsCore: "^16.9.0",
    requiresFumadocsUi: "^16.9.0",
    requiresReact: "^19.2.0",
    requiresScalarApiClientReact: "^2.0.20",
    compatibleWithRecordedStack: true,
    status: OPENAPI_PRODUCTION_PIN_STATUS,
  },
  upgradeCandidate: {
    fumadocsOpenapi: OPENAPI_PRODUCTION_UPGRADE_CANDIDATE.fumadocsOpenapi,
    requiresFumadocsCore: "^16.10.0",
    requiresFumadocsUi: "^16.10.0",
    requiresReact: "^19.2.0",
    requiresScalarApiClientReact: "^2.0.20",
    compatibleWithRecordedStack: false,
    upgradeRisk:
      'Requires a coordinated fumadocs-core + fumadocs-ui bump onto the 16.10 line (ui peers a matching core patch). Do not adopt fumadocs-openapi 11.2 while remaining on 16.9. Revalidate single-page per:"file" projection, playground suppression, theme/code-block hooks, and SSR cost after the major bump. Existing zod ^3 vs optional fumadocs-core zod 4.x peer soft-mismatch continues on both lines.',
  },
  asyncapi: OPENAPI_PRODUCTION_ASYNCAPI_POLICY,
} as const;

/** True when a package name is part of the W08 production OpenAPI pin set. */
export function isOpenApiProductionDependency(
  packageName: string,
): packageName is OpenApiProductionDependencyName {
  return (OPENAPI_PRODUCTION_DEPENDENCY_SET as readonly string[]).includes(
    packageName,
  );
}
