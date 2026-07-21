import { describe, expect, test } from "bun:test";
import { schemaExampleOriginLabel } from "@/features/references/schema/schema-example-display";
import {
  referenceInventoryLifecycleFilterOptions,
  referenceInventoryVisibilityFilterOptions,
} from "@/features/references/shared/reference-inventory-filter";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { supportedLocales } from "@/lib/i18n/locale-routing";
import {
  assertReferenceChromeMessages,
  formatReferenceChromeTemplate,
  ReferenceChromeLabelsError,
  resolveReferenceChromeMessages,
} from "@/lib/i18n/reference-chrome-labels";

describe("reference chrome labels", () => {
  test("every shipped locale resolves non-empty reference chrome catalogs", async () => {
    for (const locale of supportedLocales) {
      const chrome = resolveReferenceChromeMessages(
        await loadUiMessages(locale),
      );

      expect(chrome.filter.clearFilters.trim().length).toBeGreaterThan(0);
      expect(chrome.status.loadingTitle.trim().length).toBeGreaterThan(0);
      expect(chrome.badge.family.trim().length).toBeGreaterThan(0);
      expect(chrome.a11y.copyAnchorLink.trim().length).toBeGreaterThan(0);
      expect(chrome.examples.generated.trim().length).toBeGreaterThan(0);
      expect(chrome.inventory.cli.emptyTitle.trim().length).toBeGreaterThan(0);
      expect(chrome.inventory.mcp.filterLegend.trim().length).toBeGreaterThan(
        0,
      );
      expect(
        chrome.inventory.javascript.errorTitle.trim().length,
      ).toBeGreaterThan(0);

      // Literal family contract tokens stay untranslated.
      expect(chrome.families.api).toBe("API");
      expect(chrome.families.cli).toBe("CLI");
      expect(chrome.families.mcp).toBe("MCP");
    }
  });

  test("non-english chrome differs from english where translation is expected", async () => {
    const en = resolveReferenceChromeMessages(await loadUiMessages("en"));
    const ja = resolveReferenceChromeMessages(await loadUiMessages("ja"));
    const vi = resolveReferenceChromeMessages(await loadUiMessages("vi"));
    const zhCN = resolveReferenceChromeMessages(await loadUiMessages("zh-CN"));

    expect(ja.filter.clearFilters).not.toBe(en.filter.clearFilters);
    expect(ja.badge.family).not.toBe(en.badge.family);
    expect(ja.lifecycleStates.active).not.toBe(en.lifecycleStates.active);
    expect(ja.a11y.copyAnchorLink).not.toBe(en.a11y.copyAnchorLink);

    expect(vi.filter.lifecycleLabel).not.toBe(en.filter.lifecycleLabel);
    expect(vi.inventory.cli.emptyTitle).not.toBe(en.inventory.cli.emptyTitle);

    expect(zhCN.status.emptyTitle).not.toBe(en.status.emptyTitle);
    expect(zhCN.examples.generated).not.toBe(en.examples.generated);

    // Generated-example chrome may localize; payloads stay English elsewhere.
    expect(schemaExampleOriginLabel("generated", ja)).toBe(
      ja.examples.generated,
    );
    expect(schemaExampleOriginLabel("generated", ja)).not.toBe(
      "Generated example",
    );
  });

  test("filter option helpers localize labels while preserving facet values", async () => {
    const ja = resolveReferenceChromeMessages(await loadUiMessages("ja"));
    const lifecycle = referenceInventoryLifecycleFilterOptions(ja);
    expect(lifecycle[0]?.value).toBe("all");
    expect(lifecycle[0]?.label).toBe(ja.filter.allLifecycles);
    expect(
      lifecycle.find((option) => option.value === "deprecated")?.label,
    ).toBe(ja.lifecycleStates.deprecated);

    const visibility = referenceInventoryVisibilityFilterOptions(
      ["public", "internal"],
      ja,
    );
    expect(visibility.find((option) => option.value === "public")?.label).toBe(
      ja.visibilityStates.public,
    );
    // Custom published tokens stay byte-identical (untranslated).
    const custom = referenceInventoryVisibilityFilterOptions(
      ["visible-only"],
      ja,
    );
    expect(
      custom.find((option) => option.value === "visible-only")?.label,
    ).toBe("visible-only");
  });

  test("formatReferenceChromeTemplate interpolates placeholders", () => {
    expect(
      formatReferenceChromeTemplate("Showing {resultCount} of {totalCount}", {
        resultCount: 2,
        totalCount: 5,
      }),
    ).toBe("Showing 2 of 5");
  });

  test("assertReferenceChromeMessages fails closed for missing chrome catalogs", () => {
    expect(() => assertReferenceChromeMessages(undefined)).toThrow(
      ReferenceChromeLabelsError,
    );
    expect(() => assertReferenceChromeMessages({})).toThrow(
      ReferenceChromeLabelsError,
    );
    expect(() =>
      assertReferenceChromeMessages({
        filter: {
          queryPlaceholder: "x",
          lifecycleLabel: "x",
          visibilityLabel: "x",
          allLifecycles: "x",
          allVisibility: "x",
          clearFilters: "",
          showingOf: "x",
          schemaQueryPlaceholder: "x",
          schemaQueryLabel: "x",
          schemaNoMatchesTitle: "x",
          schemaNoMatchesMessage: "x",
          clear: "x",
        },
      }),
    ).toThrow(/clearFilters/);
  });
});
