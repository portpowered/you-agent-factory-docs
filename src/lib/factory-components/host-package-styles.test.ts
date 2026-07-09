import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  FACTORY_COMPONENTS_STYLES_EXPORT,
  resolveFactoryComponentsStylesPath,
} from "@/lib/factory-components/host-package-styles";

describe("factory components host package styles", () => {
  test("resolves the published styles.css export to a readable CSS entrypoint", () => {
    expect(FACTORY_COMPONENTS_STYLES_EXPORT).toBe(
      "@you-agent-factory/components/styles.css",
    );

    const stylesPath = resolveFactoryComponentsStylesPath();
    expect(stylesPath.endsWith("styles.css")).toBe(true);

    const css = readFileSync(stylesPath, "utf8");
    expect(css).toContain("@you-agent-factory/components package styles");
    expect(css).toContain('@import "./styles/color-palette-presets.css"');
  });
});
