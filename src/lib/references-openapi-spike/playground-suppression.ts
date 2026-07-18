/**
 * W01 spike playground / live-execution policy.
 *
 * The spike must prove a static-only reference path: no try-it/send controls,
 * no proxy route, and no credential entry UI. Static request/response examples
 * remain visible via fumadocs usage tabs + schema examples.
 */

/** Options passed to `createAPIPage` to disable interactive playground UI. */
export const SPIKE_PLAYGROUND_OPTIONS = {
  enabled: false,
} as const;

/**
 * Explicit non-proxy policy for `createOpenAPI`. Fumadocs playground fetches
 * through `proxyUrl` when set; the spike must leave it unset and must not add
 * a matching App Router proxy handler.
 */
export const SPIKE_PROXY_POLICY = {
  proxyUrl: undefined,
  /** App Router paths that must not exist for this spike. */
  forbiddenProxyRouteSegments: [
    "api/proxy",
    "api/openapi-proxy",
    "api/references-openapi-spike",
  ] as const,
} as const;

export function isPlaygroundSuppressed(
  playground: { enabled?: boolean } | undefined,
): boolean {
  return playground?.enabled === false;
}

export function assertsNoProxyUrl(
  options: { proxyUrl?: string | undefined } | undefined,
): boolean {
  return options?.proxyUrl === undefined || options.proxyUrl === "";
}
