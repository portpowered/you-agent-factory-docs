/**
 * Production createAPIPage binder proofs (playground off, no proxy, schema UI).
 */

import { describe, expect, test } from "bun:test";
import {
  API_FUMADOCS_OPERATION_ATTR,
  API_FUMADOCS_OPERATIONS_ATTR,
  API_SCHEMA_COMPONENT_PROBE,
  API_SCHEMA_SLOT_ATTR,
  API_SCHEMA_UI_OPTIONS,
  ApiReferenceAPIPage,
  apiReferenceApiPagePlaygroundDisabled,
  apiReferenceSchemaUiShowsExamples,
} from "./api-page";
import {
  apiOpenApiServer,
  apiOpenApiServerOmitsProxyUrl,
} from "./openapi-server";
import {
  API_PLAYGROUND_OPTIONS,
  assertsNoApiProxyUrl,
  isApiPlaygroundSuppressed,
} from "./playground-suppression";

describe("ApiReferenceAPIPage (createAPIPage binder)", () => {
  test("exports a Fumadocs APIPage function with playground disabled", () => {
    expect(typeof ApiReferenceAPIPage).toBe("function");
    expect(apiReferenceApiPagePlaygroundDisabled()).toBe(true);
    expect(isApiPlaygroundSuppressed(API_PLAYGROUND_OPTIONS)).toBe(true);
  });

  test("binds createOpenAPI server without a proxyUrl", () => {
    expect(apiOpenApiServerOmitsProxyUrl()).toBe(true);
    expect(assertsNoApiProxyUrl(apiOpenApiServer.options)).toBe(true);
  });

  test("exposes Fumadocs operation host markers for the published mount", () => {
    expect(API_FUMADOCS_OPERATIONS_ATTR).toBe("data-api-fumadocs-operations");
    expect(API_FUMADOCS_OPERATION_ATTR).toBe("data-api-fumadocs-operation");
  });

  test("keeps Fumadocs schemaUI examples enabled for component object fields", () => {
    expect(API_SCHEMA_UI_OPTIONS.showExample).toBe(true);
    expect(apiReferenceSchemaUiShowsExamples()).toBe(true);
  });

  test("marks request/response slots that host Fumadocs Schema UI", () => {
    expect(API_SCHEMA_SLOT_ATTR).toBe("data-api-schema-slot");
  });

  test("records a stable body $ref probe target for browser verification", () => {
    expect(API_SCHEMA_COMPONENT_PROBE.operationId).toBe(
      "submitWorkBySessionId",
    );
    expect(API_SCHEMA_COMPONENT_PROBE.schemaRef).toBe(
      "#/components/schemas/SubmitWorkRequest",
    );
    expect(API_SCHEMA_COMPONENT_PROBE.expectedFieldNames).toContain("name");
    expect(API_SCHEMA_COMPONENT_PROBE.expectedFieldNames).toContain(
      "workTypeName",
    );
    expect(API_SCHEMA_COMPONENT_PROBE.expectedFieldNames).toContain("items");
  });
});
