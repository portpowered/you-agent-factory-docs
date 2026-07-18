/**
 * Load the primary local-server base URL notice from the package OpenAPI
 * artifact (same W03 corpus as navigation / operation detail).
 */

import { loadApiOpenApiArtifact } from "./load-openapi-artifact";
import {
  type ApiLocalServerBaseUrl,
  projectApiLocalServerBaseUrls,
  resolvePrimaryApiLocalServerBaseUrl,
} from "./local-server-base-url";

export type ApiLocalServerBaseUrlProjection = {
  servers: ApiLocalServerBaseUrl[];
  primary: ApiLocalServerBaseUrl | undefined;
};

export function buildApiLocalServerBaseUrlFromArtifact(): ApiLocalServerBaseUrlProjection {
  const loaded = loadApiOpenApiArtifact();
  const document = loaded.document as {
    servers?: ReadonlyArray<{ url?: unknown; description?: unknown }>;
  };
  const servers = projectApiLocalServerBaseUrls(document);
  return {
    servers,
    primary: resolvePrimaryApiLocalServerBaseUrl(document) ?? servers[0],
  };
}
