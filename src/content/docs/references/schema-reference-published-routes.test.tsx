/**
 * Cross-route proof for the three W11 schema reference pages.
 *
 * Asserts published-route presence, W07 success markers, stable pagePath
 * ownership, and accessible invalid status on acquisition failure — page-owned
 * behavior only (not renderer inventories, shared nav, or source-tree scans).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { source } from "@/lib/source";
import {
  FACTORY_SCHEMA_PAGE_PATH,
  FactorySchemaReference,
  type FactorySchemaReferenceProps,
} from "./factory-schema/FactorySchemaReference";
import {
  MOCK_WORKERS_SCHEMA_PAGE_PATH,
  MockWorkersSchemaReference,
  type MockWorkersSchemaReferenceProps,
} from "./mock-workers-schema/MockWorkersSchemaReference";
import {
  YOU_CONFIG_SCHEMA_PAGE_PATH,
  YouConfigSchemaReference,
  type YouConfigSchemaReferenceProps,
} from "./you-config-schema/YouConfigSchemaReference";

type SchemaMountProps =
  | FactorySchemaReferenceProps
  | YouConfigSchemaReferenceProps
  | MockWorkersSchemaReferenceProps;

type SchemaRouteCase = {
  slug: string;
  path: string;
  testId: string;
  fieldPath: string;
  unavailableTitle: RegExp;
  Mount: ComponentType<SchemaMountProps>;
};

const SCHEMA_ROUTES: SchemaRouteCase[] = [
  {
    slug: "factory-schema",
    path: FACTORY_SCHEMA_PAGE_PATH,
    testId: "factory-schema-reference",
    fieldPath: "workers",
    unavailableTitle: /Factory schema unavailable/i,
    Mount: FactorySchemaReference,
  },
  {
    slug: "you-config-schema",
    path: YOU_CONFIG_SCHEMA_PAGE_PATH,
    testId: "you-config-schema-reference",
    fieldPath: "backendScopeID",
    unavailableTitle: /You-config schema unavailable/i,
    Mount: YouConfigSchemaReference,
  },
  {
    slug: "mock-workers-schema",
    path: MOCK_WORKERS_SCHEMA_PAGE_PATH,
    testId: "mock-workers-schema-reference",
    fieldPath: "mockWorkers",
    unavailableTitle: /Mock-workers schema unavailable/i,
    Mount: MockWorkersSchemaReference,
  },
];

describe("published schema reference routes", () => {
  afterEach(() => {
    cleanup();
  });

  test("all three schema routes are discoverable via nested page discovery", () => {
    for (const route of SCHEMA_ROUTES) {
      const page = source.getPage(["references", route.slug]);
      expect(page).toBeDefined();
      expect(page?.url).toBe(route.path);
    }
  });

  for (const route of SCHEMA_ROUTES) {
    test(`${route.path} mounts W07 ready state with stable pagePath ownership`, () => {
      const { Mount } = route;
      render(<Mount />);

      const surface = screen.getByTestId(route.testId);
      expect(surface.getAttribute("data-schema-status")).toBe("ready");
      expect(
        surface.querySelector('[data-schema-reference-mode="complete"]'),
      ).toBeTruthy();
      expect(
        surface.querySelector(`[data-schema-field-path="${route.fieldPath}"]`),
      ).toBeTruthy();

      const deepLink =
        surface.querySelector(`a[href^="${route.path}#"]`) ??
        surface.querySelector(`[data-schema-deep-link^="${route.path}#"]`);
      expect(deepLink).toBeTruthy();
    });

    test(`${route.path} shows accessible invalid status when acquisition fails`, () => {
      const { Mount } = route;
      render(
        <Mount
          loadModel={() => {
            throw new Error(`simulated ${route.slug} acquisition failure`);
          }}
        />,
      );

      const surface = screen.getByTestId(route.testId);
      const alert = screen.getByRole("alert");
      expect(surface.contains(alert)).toBe(true);
      expect(alert.getAttribute("data-schema-status")).toBe("invalid");
      expect(alert.textContent ?? "").toMatch(route.unavailableTitle);
      expect(alert.textContent ?? "").toMatch(
        new RegExp(`simulated ${route.slug} acquisition failure`, "i"),
      );
    });
  }
});
