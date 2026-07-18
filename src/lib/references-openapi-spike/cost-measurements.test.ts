import { describe, expect, test } from "bun:test";
import {
  deriveSpikeCostRisks,
  extractReferencedScriptUrls,
  filterNextStaticJsUrls,
  formatBytes,
  pathMentionsOpenApiSpike,
  SPIKE_COST_MEASUREMENT_METHOD,
  SPIKE_ROUTE_PATH,
  SPIKE_SEARCH_PROJECTION_POLICY,
  utf8ByteLength,
} from "./cost-measurements";

describe("W01 OpenAPI spike cost measurements", () => {
  test("measurement method documents reproducible commands and definitions", () => {
    expect(SPIKE_COST_MEASUREMENT_METHOD.buildMode).toBe("next-dev-ssr");
    expect(
      SPIKE_COST_MEASUREMENT_METHOD.reproductionCommands.length,
    ).toBeGreaterThan(0);
    expect(
      SPIKE_COST_MEASUREMENT_METHOD.definitions.htmlBytes.length,
    ).toBeGreaterThan(20);
    expect(
      SPIKE_COST_MEASUREMENT_METHOD.definitions.hydrationProxyMs,
    ).toContain("domContentLoadedEventEnd");
  });

  test("search projection policy keeps spike out of shared inventories", () => {
    expect(SPIKE_SEARCH_PROJECTION_POLICY.includedInSharedSearchInventory).toBe(
      false,
    );
    expect(
      SPIKE_SEARCH_PROJECTION_POLICY.includedInSharedSitemapInventory,
    ).toBe(false);
    expect(
      SPIKE_SEARCH_PROJECTION_POLICY.expectedSearchProjectionDeltaBytes,
    ).toBe(0);
  });

  test("extracts and filters Next static script URLs", () => {
    const html = `
      <script src="/_next/static/chunks/main.js"></script>
      <script src="https://cdn.example/x.js"></script>
      <script src="/_next/static/chunks/page.js"></script>
      <script>inline()</script>
    `;
    const urls = extractReferencedScriptUrls(html, "http://127.0.0.1:3466");
    expect(urls).toContain("http://127.0.0.1:3466/_next/static/chunks/main.js");
    expect(filterNextStaticJsUrls(urls)).toEqual([
      "http://127.0.0.1:3466/_next/static/chunks/main.js",
      "http://127.0.0.1:3466/_next/static/chunks/page.js",
    ]);
  });

  test("utf8ByteLength and formatBytes are stable", () => {
    expect(utf8ByteLength("abc")).toBe(3);
    expect(utf8ByteLength("é")).toBe(2);
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KiB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.00 MiB");
  });

  test("deriveSpikeCostRisks flags large HTML and overflow", () => {
    const risks = deriveSpikeCostRisks({
      htmlBytes: 12_000_000,
      jsPayloadBytes: 100_000,
      hydrationProxyMs: 8_000,
      searchProjectionDeltaBytes: 0,
      pageOverflowPx: 40,
    });
    expect(risks.some((r) => r.includes("very large"))).toBe(true);
    expect(risks.some((r) => r.includes("DOMContentLoaded"))).toBe(true);
    expect(risks.some((r) => r.includes("horizontal overflow"))).toBe(true);
  });

  test("pathMentionsOpenApiSpike detects spike route strings", () => {
    expect(pathMentionsOpenApiSpike(SPIKE_ROUTE_PATH)).toBe(true);
    expect(pathMentionsOpenApiSpike("/docs/references/api")).toBe(false);
    expect(pathMentionsOpenApiSpike("/docs/guides/loops")).toBe(false);
  });
});
