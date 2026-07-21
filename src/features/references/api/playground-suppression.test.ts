import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  apiOpenApiServer,
  apiOpenApiServerOmitsProxyUrl,
} from "./openapi-server";
import {
  API_PLAYGROUND_OPTIONS,
  API_PROXY_POLICY,
  apiReferencePlaygroundPageOptions,
  assertsNoApiProxyUrl,
  isApiPlaygroundSuppressed,
} from "./playground-suppression";

describe("W08 production playground suppression", () => {
  test("playground options disable interactive try-it / Send controls", () => {
    expect(API_PLAYGROUND_OPTIONS.enabled).toBe(false);
    expect(isApiPlaygroundSuppressed(API_PLAYGROUND_OPTIONS)).toBe(true);
    expect(isApiPlaygroundSuppressed({ enabled: true })).toBe(false);
    expect(isApiPlaygroundSuppressed(undefined)).toBe(false);
    expect(apiReferencePlaygroundPageOptions()).toEqual({
      playground: API_PLAYGROUND_OPTIONS,
    });
  });

  test("proxy policy leaves proxyUrl unset on createOpenAPI server", () => {
    expect(API_PROXY_POLICY.proxyUrl).toBeUndefined();
    expect(assertsNoApiProxyUrl(API_PROXY_POLICY)).toBe(true);
    expect(assertsNoApiProxyUrl({ proxyUrl: "/api/proxy" })).toBe(false);
    expect(apiOpenApiServer.options.proxyUrl).toBeUndefined();
    expect(assertsNoApiProxyUrl(apiOpenApiServer.options)).toBe(true);
    expect(apiOpenApiServerOmitsProxyUrl()).toBe(true);
  });

  test("no OpenAPI proxy App Router handlers exist for the production surface", () => {
    const appRoot = join(process.cwd(), "src/app");
    for (const segment of API_PROXY_POLICY.forbiddenProxyRouteSegments) {
      const routeFile = join(appRoot, ...segment.split("/"), "route.ts");
      expect(existsSync(routeFile)).toBe(false);
    }
    // Existing search route is unrelated and must remain present.
    expect(existsSync(join(appRoot, "api/search/route.ts"))).toBe(true);
  });
});
