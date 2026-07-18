import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  assertsNoProxyUrl,
  isPlaygroundSuppressed,
  SPIKE_PLAYGROUND_OPTIONS,
  SPIKE_PROXY_POLICY,
} from "./playground-suppression";

describe("W01 OpenAPI spike playground suppression", () => {
  test("playground options disable interactive try-it / Send controls", () => {
    expect(SPIKE_PLAYGROUND_OPTIONS.enabled).toBe(false);
    expect(isPlaygroundSuppressed(SPIKE_PLAYGROUND_OPTIONS)).toBe(true);
    expect(isPlaygroundSuppressed({ enabled: true })).toBe(false);
    expect(isPlaygroundSuppressed(undefined)).toBe(false);
  });

  test("proxy policy leaves proxyUrl unset", () => {
    expect(SPIKE_PROXY_POLICY.proxyUrl).toBeUndefined();
    expect(assertsNoProxyUrl(SPIKE_PROXY_POLICY)).toBe(true);
    expect(assertsNoProxyUrl({ proxyUrl: "/api/proxy" })).toBe(false);
  });

  test("no OpenAPI proxy App Router handlers exist for the spike", () => {
    const appRoot = join(process.cwd(), "src/app");
    for (const segment of SPIKE_PROXY_POLICY.forbiddenProxyRouteSegments) {
      const routeFile = join(appRoot, ...segment.split("/"), "route.ts");
      expect(existsSync(routeFile)).toBe(false);
    }
    // Existing search route is unrelated and must remain present.
    expect(existsSync(join(appRoot, "api/search/route.ts"))).toBe(true);
  });
});
