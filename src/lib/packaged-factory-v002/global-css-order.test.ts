/**
 * Global CSS order contract for packaged-factory 0.0.2 Batch 1.
 *
 * Components styles before visualizers styles; no direct React Flow import
 * in the host global entry. Fail closed on missing, duplicated, out-of-order,
 * or forbidden React Flow stylesheet imports.
 */

import { describe, expect, test } from "bun:test";
import {
  assertPackagedFactoryV002GlobalCssOrder,
  extractCssImportTargets,
  GlobalCssOrderError,
  PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT,
  PACKAGED_FACTORY_V002_FORBIDDEN_REACT_FLOW_STYLE_IMPORTS,
  PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT,
} from "./global-css-order";
import { provePackagedFactoryV002GlobalCssOrder } from "./global-css-order-proof";

const validOrderedCss = `
@import "tailwindcss";
@import "${PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT}";
@import "${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT}";
@import "fumadocs-ui/css/neutral.css";
`;

describe("packaged-factory-v002 global CSS order", () => {
  test("extractCssImportTargets reads quote-delimited @import paths in order", () => {
    expect(extractCssImportTargets(validOrderedCss)).toEqual([
      "tailwindcss",
      PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT,
      PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT,
      "fumadocs-ui/css/neutral.css",
    ]);
  });

  test("pure helper accepts components styles before visualizers styles", () => {
    expect(() =>
      assertPackagedFactoryV002GlobalCssOrder(validOrderedCss),
    ).not.toThrow();
  });

  test("fails closed when components styles import is missing", () => {
    const css = `
@import "tailwindcss";
@import "${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT}";
`;
    expect(() => assertPackagedFactoryV002GlobalCssOrder(css)).toThrow(
      GlobalCssOrderError,
    );
    try {
      assertPackagedFactoryV002GlobalCssOrder(css);
    } catch (error) {
      expect(error).toBeInstanceOf(GlobalCssOrderError);
      expect((error as GlobalCssOrderError).code).toBe(
        "missing-components-styles",
      );
    }
  });

  test("fails closed when visualizers styles import is missing", () => {
    const css = `
@import "tailwindcss";
@import "${PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT}";
`;
    expect(() => assertPackagedFactoryV002GlobalCssOrder(css)).toThrow(
      /factory-visualizers\/styles\.css/,
    );
    try {
      assertPackagedFactoryV002GlobalCssOrder(css);
    } catch (error) {
      expect(error).toBeInstanceOf(GlobalCssOrderError);
      expect((error as GlobalCssOrderError).code).toBe(
        "missing-visualizers-styles",
      );
    }
  });

  test("fails closed when components styles appear after visualizers", () => {
    const css = `
@import "${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT}";
@import "${PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT}";
`;
    expect(() => assertPackagedFactoryV002GlobalCssOrder(css)).toThrow(
      /before/,
    );
    try {
      assertPackagedFactoryV002GlobalCssOrder(css);
    } catch (error) {
      expect(error).toBeInstanceOf(GlobalCssOrderError);
      expect((error as GlobalCssOrderError).code).toBe("styles-out-of-order");
    }
  });

  test("fails closed when either package styles import is duplicated", () => {
    const duplicatedComponents = `
@import "${PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT}";
@import "${PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT}";
@import "${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT}";
`;
    expect(() =>
      assertPackagedFactoryV002GlobalCssOrder(duplicatedComponents),
    ).toThrow(/exactly once/);

    const duplicatedVisualizers = `
@import "${PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT}";
@import "${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT}";
@import "${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT}";
`;
    expect(() =>
      assertPackagedFactoryV002GlobalCssOrder(duplicatedVisualizers),
    ).toThrow(GlobalCssOrderError);
  });

  test("fails closed when a direct React Flow stylesheet import reappears", () => {
    for (const forbidden of PACKAGED_FACTORY_V002_FORBIDDEN_REACT_FLOW_STYLE_IMPORTS) {
      const css = `
@import "${PACKAGED_FACTORY_V002_COMPONENTS_STYLES_IMPORT}";
@import "${PACKAGED_FACTORY_V002_VISUALIZERS_STYLES_IMPORT}";
@import "${forbidden}";
`;
      expect(() => assertPackagedFactoryV002GlobalCssOrder(css)).toThrow(
        GlobalCssOrderError,
      );
      try {
        assertPackagedFactoryV002GlobalCssOrder(css);
      } catch (error) {
        expect(error).toBeInstanceOf(GlobalCssOrderError);
        expect((error as GlobalCssOrderError).code).toBe(
          "forbidden-react-flow-import",
        );
      }
    }
  });

  test("host globals.css satisfies the Batch 1 CSS order contract", () => {
    const proof = provePackagedFactoryV002GlobalCssOrder();
    expect(proof.globalsCssPath).toContain("src/app/globals.css");
    expect(proof.visualizersStylesPath.length).toBeGreaterThan(0);
    expect(proof.visualizersStylesContainsReactFlowImport).toBe(true);
  });
});
