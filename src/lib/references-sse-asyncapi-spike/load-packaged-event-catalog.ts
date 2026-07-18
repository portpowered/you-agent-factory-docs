/**
 * Load the temporary schema-backed event catalog from packaged OpenAPI.
 * Shared by separate-catalog and hybrid placement spikes.
 */

import {
  buildEventCatalogFixture,
  type EventCatalogFixture,
} from "./build-event-catalog-fixture";
import type { OpenApiComponentsLike } from "./event-schema-discoverability";
import { loadPackagedOpenApiArtifact } from "./load-packaged-openapi";
import { parseOpenApiYamlText } from "./parse-openapi-yaml";

export function loadPackagedEventCatalogFixture(): EventCatalogFixture {
  const artifact = loadPackagedOpenApiArtifact();
  const doc = parseOpenApiYamlText<OpenApiComponentsLike>(artifact.rawText);
  return buildEventCatalogFixture(doc);
}
