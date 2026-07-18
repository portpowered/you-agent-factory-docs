/**
 * W08 production playground / live-execution policy.
 *
 * The production API surface is static-only: no try-it / Send controls, no
 * proxy route, and no credential-entry UI. Static request/response examples
 * remain visible without a reachable Factory host.
 *
 * Migrated from the W01 spike policy into the production ownership tree.
 * Prefer this module over editing `src/lib/references-openapi-spike/`.
 */

/** Options passed to `createAPIPage` to disable interactive playground UI. */
export const API_PLAYGROUND_OPTIONS = {
  enabled: false,
} as const;

/**
 * Explicit non-proxy policy for `createOpenAPI`. Fumadocs playground fetches
 * through `proxyUrl` when set; production must leave it unset and must not add
 * a matching App Router proxy handler.
 */
export const API_PROXY_POLICY = {
  proxyUrl: undefined,
  /** App Router paths that must not exist for the production API surface. */
  forbiddenProxyRouteSegments: [
    "api/proxy",
    "api/openapi-proxy",
    "api/references-api-proxy",
  ] as const,
} as const;

/** Marker attribute for static-only / no-playground chrome. */
export const API_PLAYGROUND_SUPPRESSED_ATTR =
  "data-api-playground-suppressed" as const;

export function isApiPlaygroundSuppressed(
  playground: { enabled?: boolean } | undefined,
): boolean {
  return playground?.enabled === false;
}

export function assertsNoApiProxyUrl(
  options: { proxyUrl?: string | undefined } | undefined,
): boolean {
  return options?.proxyUrl === undefined || options.proxyUrl === "";
}

/**
 * Page options fragment for `createAPIPage` / Fumadocs OpenAPI UI — always
 * disables live execution. Stronger custom renderers may omit playground slots
 * entirely; this remains the contract when Fumadocs page creation is used.
 */
export function apiReferencePlaygroundPageOptions(): {
  playground: typeof API_PLAYGROUND_OPTIONS;
} {
  return { playground: API_PLAYGROUND_OPTIONS };
}
