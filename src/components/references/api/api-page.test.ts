/**
 * Production createAPIPage binder proofs (playground off, no proxy, schema UI).
 */

import { describe, expect, test } from "bun:test";
import {
  API_FUMADOCS_OPERATION_ATTR,
  API_FUMADOCS_OPERATIONS_ATTR,
  ApiReferenceAPIPage,
  apiReferenceApiPagePlaygroundDisabled,
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
});
