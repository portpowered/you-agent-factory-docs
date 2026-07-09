import { describe, expect, test } from "bun:test";
import {
  COMPONENTS_PACKAGE_NAME,
  FACTORY_COMPONENTS_CHARTS_CATEGORY,
  FACTORY_COMPONENTS_DATA_DISPLAY_CATEGORY,
  FACTORY_COMPONENTS_GRAPHS_CATEGORY,
} from "@/lib/factory-components/host-package-surface";

describe("factory components host package surface", () => {
  test("resolves root and category TypeScript source exports through the host import", () => {
    expect(COMPONENTS_PACKAGE_NAME).toBe("@you-agent-factory/components");
    expect(FACTORY_COMPONENTS_GRAPHS_CATEGORY).toBe("graphs");
    expect(FACTORY_COMPONENTS_CHARTS_CATEGORY).toBe("charts");
    expect(FACTORY_COMPONENTS_DATA_DISPLAY_CATEGORY).toBe("data-display");
  });
});
