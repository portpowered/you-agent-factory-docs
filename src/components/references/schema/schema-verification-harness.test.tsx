import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { SchemaVerificationHarness } from "@/components/references/schema/schema-verification-harness";
import { loadAllSchemaVerificationPackageModels } from "@/lib/references/load-schema-verification-models";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";
import { collectResponsiveOverflowProbe } from "@/lib/verify/a11y-responsive-probes";

afterEach(() => {
  cleanup();
});

function findDefinitionByPointerLeaf(
  definitions: readonly SchemaDefinitionModel[],
  leaf: string,
): SchemaDefinitionModel | undefined {
  return definitions.find((definition) =>
    definition.address.pointer.endsWith(`/${leaf}`),
  );
}

function buildHarnessPackages() {
  return loadAllSchemaVerificationPackageModels().map((entry) => {
    const focusLeaf =
      entry.subpath === "schemas/factory"
        ? "WorkContentPart"
        : entry.subpath === "schemas/mock-workers"
          ? "mockWorker"
          : "workerPreset";
    const focus = findDefinitionByPointerLeaf(entry.definitions, focusLeaf);

    return {
      subpath: entry.subpath,
      specifier: entry.specifier,
      root: entry.root,
      definitions: entry.definitions,
      ...(focus !== undefined ? { focusDefinition: focus } : {}),
    };
  });
}

function setViewportWidth(width: number) {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(document.documentElement, "scrollWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(document.body, "clientWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(document.body, "scrollWidth", {
    configurable: true,
    get: () => width,
  });
}

describe("schema verification harness (real W03 schemas)", () => {
  test("renders definition/field visibility for factory, you-config, and mock-workers", () => {
    const packages = buildHarnessPackages();
    render(<SchemaVerificationHarness packages={packages} />);

    expect(
      screen.getAllByRole("heading", { name: /You Factory configuration/i })
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("heading", {
        name: /You operator and system configuration/i,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("heading", {
        name: /You mock-worker configuration/i,
      }).length,
    ).toBeGreaterThan(0);

    const factory = screen.getByTestId(
      "schema-verification-harness-schemas/factory",
    );
    expect(
      factory.querySelector('[data-schema-field-path="workers"]'),
    ).toBeTruthy();
    expect(factory.querySelector('[data-schema-field-path="id"]')).toBeTruthy();

    const youConfig = screen.getByTestId(
      "schema-verification-harness-schemas/you-config",
    );
    expect(
      youConfig.querySelector('[data-schema-field-path="workerPresets"]'),
    ).toBeTruthy();

    const mockWorkers = screen.getByTestId(
      "schema-verification-harness-schemas/mock-workers",
    );
    expect(
      mockWorkers.querySelector('[data-schema-field-path="mockWorkers"]'),
    ).toBeTruthy();

    // Real mock-workers root publishes default + enum on unmatchedDispatchPolicy;
    // field rows must compose SchemaDefaultValue / SchemaConstraintList in-tree.
    const policyRow = mockWorkers.querySelector(
      '[data-schema-field-path="unmatchedDispatchPolicy"]',
    );
    expect(policyRow).toBeTruthy();
    expect(
      policyRow?.querySelector('[data-testid="schema-default-value"]'),
    ).toBeTruthy();
    expect(
      policyRow
        ?.querySelector('[data-testid="schema-default-value"]')
        ?.querySelector('[data-schema-default="value"]')?.textContent,
    ).toBe('"accept"');
    expect(
      policyRow?.querySelector(
        '[data-testid="schema-constraint-list"] [data-schema-constraint="enum"]',
      ),
    ).toBeTruthy();
  });

  test("covers composition/$ref navigation, filter usage, and example states", () => {
    const packages = buildHarnessPackages();
    render(<SchemaVerificationHarness packages={packages} />);

    const factoryFocus = screen.getByTestId(
      "schema-verification-harness-schemas/factory-focus",
    );
    expect(
      within(factoryFocus).getByRole("region", {
        name: /oneOf composition/i,
      }),
    ).toBeTruthy();
    expect(within(factoryFocus).getAllByRole("link").length).toBeGreaterThan(0);

    const mockFocus = screen.getByTestId(
      "schema-verification-harness-schemas/mock-workers-focus",
    );
    expect(
      within(mockFocus).getAllByTestId("schema-ref-link").length,
    ).toBeGreaterThan(0);

    const youFocus = screen.getByTestId(
      "schema-verification-harness-schemas/you-config-focus",
    );
    expect(
      within(youFocus).getAllByTestId("schema-ref-link").length,
    ).toBeGreaterThan(0);

    const factory = screen.getByTestId(
      "schema-verification-harness-schemas/factory",
    );
    const filter = within(factory).getByRole("searchbox");
    fireEvent.change(filter, { target: { value: "WorkContentPart" } });
    expect(within(factory).getByText("WorkContentPart")).toBeTruthy();
    const clear = within(factory).getByRole("button", { name: "Clear" });
    clear.focus();
    expect(document.activeElement).toBe(clear);
    fireEvent.click(clear);
    expect((filter as HTMLInputElement).value).toBe("");

    const mockWorkers = screen.getByTestId(
      "schema-verification-harness-schemas/mock-workers",
    );
    expect(
      mockWorkers.querySelector('[data-schema-examples="present"]'),
    ).toBeTruthy();
    expect(
      within(mockWorkers).getAllByRole("button", { name: /copy/i }).length,
    ).toBeGreaterThan(0);

    const youConfig = screen.getByTestId(
      "schema-verification-harness-schemas/you-config",
    );
    expect(
      within(youConfig).getByRole("status", { name: "No examples" }),
    ).toBeTruthy();
  });

  test("keyboard paths for expand, filter, and $ref focus remain operable", () => {
    const packages = buildHarnessPackages();
    render(<SchemaVerificationHarness packages={packages} />);

    const probe = screen.getByTestId(
      "schema-verification-harness-keyboard-probe",
    );
    const expand = within(probe).getByRole("button", {
      name: "Expand fields under tools",
    });
    expand.focus();
    expect(document.activeElement).toBe(expand);
    fireEvent.click(expand);
    expect(expand.getAttribute("aria-expanded")).toBe("true");
    expect(
      probe.querySelector('[data-schema-field-path="tools.timeout"]'),
    ).toBeTruthy();

    const factory = screen.getByTestId(
      "schema-verification-harness-schemas/factory",
    );
    const filter = within(factory).getByRole("searchbox");
    filter.focus();
    expect(document.activeElement).toBe(filter);
    fireEvent.change(filter, { target: { value: "Worker" } });
    expect((filter as HTMLInputElement).value).toBe("Worker");

    const factoryFocus = screen.getByTestId(
      "schema-verification-harness-schemas/factory-focus",
    );
    const refLink = within(factoryFocus).getAllByRole("link")[0];
    expect(refLink).toBeTruthy();
    refLink.focus();
    expect(document.activeElement).toBe(refLink);
  });

  test("responsive overflow stays contained at phone and desktop widths", () => {
    const packages = buildHarnessPackages();
    render(<SchemaVerificationHarness packages={packages} />);

    for (const width of [390, 1440] as const) {
      setViewportWidth(width);
      const probe = collectResponsiveOverflowProbe(document, document.body);
      expect(probe.page.hasUnintendedOverflow).toBe(false);
      expect(probe.allowsIntentionalScrollers).toBe(true);

      const harness = screen.getByTestId("schema-verification-harness");
      expect(harness.className).toContain("min-w-0");
      const packageSection = harness.querySelector(
        "[data-schema-verification-package]",
      );
      expect(packageSection?.className).toContain("min-w-0");
      expect(packageSection?.className).toContain("overflow-x-auto");
    }
  });
});
