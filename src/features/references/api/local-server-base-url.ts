/**
 * Pure projectors for the production API local-server base URL notice.
 *
 * Reads published OpenAPI `servers` entries so readers see where to point
 * clients — without implying that the documentation site host is the API.
 */

export type ApiOpenApiServerEntry = {
  url: string;
  description?: string;
};

export type ApiLocalServerBaseUrl = {
  url: string;
  description: string;
  /** Explicit copy that the docs host is not the API target. */
  docsHostDisclaimer: string;
};

/** Marker attribute for the local-server base URL notice. */
export const API_LOCAL_SERVER_BASE_URL_ATTR =
  "data-api-local-server-base-url" as const;

/**
 * Default disclaimer when OpenAPI servers are present. Must never claim the
 * documentation host serves the Factory API.
 */
export const API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER =
  "This documentation site is not the Agent Factory API. Point HTTP clients at a local Factory server you run yourself — not at this docs host." as const;

/** Fallback title when a server entry has no description. */
export const API_LOCAL_SERVER_DEFAULT_DESCRIPTION =
  "Local Agent Factory API server" as const;

type OpenApiDocumentLike = {
  servers?: ReadonlyArray<{
    url?: unknown;
    description?: unknown;
  }>;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Project authored OpenAPI `servers` into local-server base URL notices.
 * Entries without a usable `url` are skipped; descriptions fall back to a
 * local-server label when absent.
 */
export function projectApiLocalServerBaseUrls(
  document: OpenApiDocumentLike,
): ApiLocalServerBaseUrl[] {
  const servers = document.servers;
  if (!Array.isArray(servers) || servers.length === 0) {
    return [];
  }

  const projected: ApiLocalServerBaseUrl[] = [];
  for (const server of servers) {
    if (!isNonEmptyString(server?.url)) continue;
    projected.push({
      url: server.url.trim(),
      description: isNonEmptyString(server.description)
        ? server.description.trim()
        : API_LOCAL_SERVER_DEFAULT_DESCRIPTION,
      docsHostDisclaimer: API_LOCAL_SERVER_DOCS_HOST_DISCLAIMER,
    });
  }
  return projected;
}

/** Prefer the first published server as the primary local base URL. */
export function resolvePrimaryApiLocalServerBaseUrl(
  document: OpenApiDocumentLike,
): ApiLocalServerBaseUrl | undefined {
  return projectApiLocalServerBaseUrls(document)[0];
}

/**
 * True when copy clearly states the docs host is not the API (for tests /
 * harness probes).
 */
export function apiLocalServerCopyAvoidsDocsHostAsApi(
  notice: Pick<ApiLocalServerBaseUrl, "docsHostDisclaimer">,
): boolean {
  const text = notice.docsHostDisclaimer.toLowerCase();
  return (
    text.includes("documentation site is not") &&
    text.includes("not at this docs host")
  );
}
