/**
 * transpilePackages posture contract for packaged-factory 0.0.2 Batch 1.
 *
 * Documents final membership: empty (no family package in transpilePackages)
 * after the clean static build proved compiled ESM does not need host
 * transpilation. Fail closed if any of the five packages reappear.
 */

import { describe, expect, test } from "bun:test";
import { PACKAGED_FACTORY_V002_PACKAGE_NAMES } from "./five-package-pins";
import {
  assertPackagedFactoryV002HostTranspileMembership,
  assertPackagedFactoryV002TranspilePackagesPosture,
  PACKAGED_FACTORY_V002_FORBIDDEN_TRANSPILE_PACKAGES,
  PACKAGED_FACTORY_V002_HOST_TRANSPILE_PACKAGES,
  TranspilePackagesPostureError,
} from "./transpile-packages-posture";

describe("packaged-factory-v002 transpilePackages posture", () => {
  test("host membership constant is empty (components removed; none of the five listed)", () => {
    expect([...PACKAGED_FACTORY_V002_HOST_TRANSPILE_PACKAGES]).toEqual([]);
    assertPackagedFactoryV002HostTranspileMembership();
  });

  test("forbidden list covers all five Batch 1 packages", () => {
    expect([...PACKAGED_FACTORY_V002_FORBIDDEN_TRANSPILE_PACKAGES]).toEqual([
      ...PACKAGED_FACTORY_V002_PACKAGE_NAMES,
    ]);
  });

  test("pure helper rejects any family package in transpilePackages", () => {
    expect(() =>
      assertPackagedFactoryV002TranspilePackagesPosture([
        "@you-agent-factory/components",
      ]),
    ).toThrow(TranspilePackagesPostureError);

    expect(() =>
      assertPackagedFactoryV002TranspilePackagesPosture([
        "@you-agent-factory/client",
      ]),
    ).toThrow(/client/);

    expect(() =>
      assertPackagedFactoryV002TranspilePackagesPosture([
        "@you-agent-factory/factory-replay",
      ]),
    ).toThrow(/factory-replay/);

    expect(() =>
      assertPackagedFactoryV002TranspilePackagesPosture([
        "@you-agent-factory/factory-visualizers",
      ]),
    ).toThrow(/factory-visualizers/);

    expect(() =>
      assertPackagedFactoryV002TranspilePackagesPosture([
        "@you-agent-factory/packaged-factories",
      ]),
    ).toThrow(/packaged-factories/);
  });

  test("pure helper accepts empty or unrelated transpilePackages entries", () => {
    expect(() =>
      assertPackagedFactoryV002TranspilePackagesPosture([]),
    ).not.toThrow();
    expect(() =>
      assertPackagedFactoryV002TranspilePackagesPosture(["some-other-package"]),
    ).not.toThrow();
  });

  test("next.config host membership matches the documented empty family posture", () => {
    // next.config.ts spreads PACKAGED_FACTORY_V002_HOST_TRANSPILE_PACKAGES.
    // Observing the shared constant keeps the config and contract aligned.
    assertPackagedFactoryV002TranspilePackagesPosture(
      PACKAGED_FACTORY_V002_HOST_TRANSPILE_PACKAGES,
    );
    for (const name of PACKAGED_FACTORY_V002_PACKAGE_NAMES) {
      expect(
        (
          PACKAGED_FACTORY_V002_HOST_TRANSPILE_PACKAGES as readonly string[]
        ).includes(name),
      ).toBe(false);
    }
  });
});
