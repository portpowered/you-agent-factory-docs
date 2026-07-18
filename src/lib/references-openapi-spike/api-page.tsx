/**
 * RSC OpenAPI page renderer for the W01 spike.
 *
 * Created via `createAPIPage` against the package-backed spike server.
 */

import { createAPIPage } from "fumadocs-openapi/ui";
import { openapiSpikeServer } from "./openapi-server";

export const OpenAPISpikeAPIPage = createAPIPage(openapiSpikeServer);
