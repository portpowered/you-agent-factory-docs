import { describe, expect, test } from "bun:test";
import {
  createReferenceInventoryFilterState,
  DEFAULT_REFERENCE_INVENTORY_FILTER,
  filterReferenceInventoryItems,
  isReferenceInventoryFilterActive,
  matchesReferenceInventoryFilter,
  type ReferenceInventoryFilterableItem,
  referenceInventoryLifecycleFilterOptions,
  referenceInventoryVisibilityFilterOptions,
} from "./reference-inventory-filter";

const items: ReferenceInventoryFilterableItem[] = [
  {
    identityText: "you config init",
    aliases: ["bootstrap"],
    description: "Create operator config",
    lifecycle: { state: "active" },
    visibility: "visible",
  },
  {
    identityText: "you mcp",
    description: "MCP servers",
    lifecycle: { state: "deprecated" },
    visibility: "internal",
  },
  {
    identityText: "you run",
    description: "Run a factory",
    lifecycle: { state: "active" },
  },
];

describe("reference inventory filter helpers", () => {
  test("default filter is inactive and matches every item", () => {
    expect(
      isReferenceInventoryFilterActive(DEFAULT_REFERENCE_INVENTORY_FILTER),
    ).toBe(false);
    expect(
      filterReferenceInventoryItems(items, DEFAULT_REFERENCE_INVENTORY_FILTER),
    ).toHaveLength(3);
  });

  test("filters by identity, alias, and description text without mutating", () => {
    const original = [...items];
    const filter = createReferenceInventoryFilterState({ query: "bootstrap" });
    const matched = filterReferenceInventoryItems(items, filter);

    expect(matched).toHaveLength(1);
    expect(matched[0]?.identityText).toBe("you config init");
    expect(items).toEqual(original);
  });

  test("filters by lifecycle state", () => {
    const filter = createReferenceInventoryFilterState({
      lifecycle: "deprecated",
    });
    const matched = filterReferenceInventoryItems(items, filter);
    expect(matched.map((item) => item.identityText)).toEqual(["you mcp"]);
  });

  test("filters by published visibility and fails closed when absent", () => {
    const internal = createReferenceInventoryFilterState({
      visibility: "internal",
    });
    expect(filterReferenceInventoryItems(items, internal)).toHaveLength(1);

    const visible = createReferenceInventoryFilterState({
      visibility: "visible",
    });
    const matchedVisible = filterReferenceInventoryItems(items, visible);
    expect(matchedVisible).toHaveLength(1);
    expect(matchedVisible[0]?.identityText).toBe("you config init");

    const itemWithoutVisibility = items[2];
    expect(itemWithoutVisibility).toBeDefined();
    if (itemWithoutVisibility === undefined) {
      throw new Error("expected third fixture item");
    }
    expect(
      matchesReferenceInventoryFilter(itemWithoutVisibility, visible),
    ).toBe(false);
  });

  test("builds visibility options only from published values", () => {
    const options = referenceInventoryVisibilityFilterOptions([
      "visible",
      undefined,
      "internal",
      "visible",
      "",
    ]);
    expect(options.map((option) => option.value)).toEqual([
      "all",
      "internal",
      "visible",
    ]);
  });

  test("lifecycle options include all published states plus all", () => {
    const options = referenceInventoryLifecycleFilterOptions();
    expect(options[0]?.value).toBe("all");
    expect(options.map((option) => option.value)).toContain("active");
    expect(options.map((option) => option.value)).toContain("deprecated");
    expect(options.map((option) => option.value)).toContain("removed");
  });
});
