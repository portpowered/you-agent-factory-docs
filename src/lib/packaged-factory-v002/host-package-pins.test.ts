/**
 * Host pin contract for packaged-factory 0.0.2 Batch 1.
 *
 * Observable proof: docs package.json declares exact 0.0.2 for all five
 * packages; installed package.json versions match; only one components
 * version resolves in node_modules.
 */

import { describe, expect, test } from "bun:test";
import {
  PACKAGED_FACTORY_V002_PACKAGE_NAMES,
  PACKAGED_FACTORY_V002_VERSION,
} from "./five-package-pins";
import {
  assertHostPackagedFactoryV002DependencyPins,
  assertSingleComponentsResolvedVersion,
  HostPackagePinError,
} from "./host-package-pins";
import { proveHostPackagedFactoryV002Pins } from "./host-package-pins-proof";

describe("packaged-factory-v002 host package pins", () => {
  test("pure helper rejects missing or drifted dependency pins", () => {
    expect(() =>
      assertHostPackagedFactoryV002DependencyPins({
        "@you-agent-factory/components": PACKAGED_FACTORY_V002_VERSION,
      }),
    ).toThrow(HostPackagePinError);

    expect(() =>
      assertHostPackagedFactoryV002DependencyPins({
        "@you-agent-factory/client": PACKAGED_FACTORY_V002_VERSION,
        "@you-agent-factory/components": "0.0.0",
        "@you-agent-factory/factory-replay": PACKAGED_FACTORY_V002_VERSION,
        "@you-agent-factory/factory-visualizers": PACKAGED_FACTORY_V002_VERSION,
        "@you-agent-factory/packaged-factories": PACKAGED_FACTORY_V002_VERSION,
      }),
    ).toThrow(/exact "0\.0\.2"/);
  });

  test("pure helper rejects dual components versions", () => {
    expect(() =>
      assertSingleComponentsResolvedVersion(["0.0.2", "0.0.0"]),
    ).toThrow(/single @you-agent-factory\/components/);
  });

  test("docs host declares and resolves all five packages at exact 0.0.2 with one components version", () => {
    const proof = proveHostPackagedFactoryV002Pins(process.cwd());

    for (const name of PACKAGED_FACTORY_V002_PACKAGE_NAMES) {
      expect(proof.declaredPins[name]).toBe(PACKAGED_FACTORY_V002_VERSION);
      expect(proof.installedVersions[name]).toBe(PACKAGED_FACTORY_V002_VERSION);
    }

    expect(proof.resolvedComponentsVersions.length).toBeGreaterThanOrEqual(1);
    expect(new Set(proof.resolvedComponentsVersions)).toEqual(
      new Set([PACKAGED_FACTORY_V002_VERSION]),
    );
  });
});
