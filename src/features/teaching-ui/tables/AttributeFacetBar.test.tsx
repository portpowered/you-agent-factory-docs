import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  AttributeFacetBar,
  type AttributeFacetBarProps,
} from "./AttributeFacetBar";
import type { AttributeDef, AttributeFilterState } from "./types";

afterEach(() => {
  cleanup();
});

const attributeDefs: AttributeDef[] = [
  {
    id: "attr.open-source",
    labelKey: "attrs.openSource",
    type: "boolean",
    filterable: true,
    sortable: true,
  },
  {
    id: "attr.summary",
    labelKey: "attrs.summary",
    type: "string",
    filterable: true,
    sortable: true,
  },
  {
    id: "attr.license",
    labelKey: "attrs.license",
    type: "single-tag",
    tagEnum: ["mit", "apache-2.0", "proprietary"],
    filterable: true,
    sortable: true,
  },
  {
    id: "attr.capabilities",
    labelKey: "attrs.capabilities",
    type: "multi-tag",
    tagEnum: ["loop", "worktree", "compaction", "harness"],
    filterable: true,
    sortable: false,
  },
  {
    id: "attr.internal-note",
    labelKey: "attrs.internalNote",
    type: "string",
    filterable: false,
    sortable: false,
  },
];

const hostLabels: Record<string, string> = {
  "attr.open-source": "Open source",
  "attr.summary": "Summary",
  "attr.license": "License",
  "attr.capabilities": "Capabilities",
};

function StatefulFacetBar({
  onFiltersChange,
  initialFilters = {},
  ...rest
}: Omit<AttributeFacetBarProps, "filters" | "onFiltersChange"> & {
  initialFilters?: AttributeFilterState;
  onFiltersChange?: (next: AttributeFilterState) => void;
}) {
  const [filters, setFilters] = useState<AttributeFilterState>(initialFilters);
  return (
    <AttributeFacetBar
      {...rest}
      filters={filters}
      onFiltersChange={(next) => {
        setFilters(next);
        onFiltersChange?.(next);
      }}
    />
  );
}

function renderFacetBar(overrides: Partial<AttributeFacetBarProps> = {}) {
  const onFiltersChange = mock((_next: AttributeFilterState) => {});
  const {
    filters: initialFilters,
    onFiltersChange: _ignored,
    ...rest
  } = overrides;
  const view = render(
    <StatefulFacetBar
      attributeDefs={attributeDefs}
      initialFilters={initialFilters}
      labels={hostLabels}
      onFiltersChange={onFiltersChange}
      {...rest}
    />,
  );
  return { ...view, onFiltersChange };
}

describe("AttributeFacetBar", () => {
  test("renders labeled controls for each filterable attribute type", () => {
    renderFacetBar();

    expect(screen.getByLabelText("Open source")).toBeTruthy();
    expect(screen.getByLabelText("Summary")).toBeTruthy();
    expect(screen.getByLabelText("License")).toBeTruthy();
    expect(screen.getByText("Capabilities")).toBeTruthy();

    expect(screen.getByRole("checkbox", { name: "loop" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "worktree" })).toBeTruthy();

    expect(screen.queryByLabelText("attrs.internalNote")).toBeNull();
    expect(screen.queryByText("attrs.internalNote")).toBeNull();
  });

  test("falls back to labelKey when host labels are omitted", () => {
    renderFacetBar({ labels: undefined });

    expect(screen.getByLabelText("attrs.openSource")).toBeTruthy();
    expect(screen.getByLabelText("attrs.summary")).toBeTruthy();
    expect(screen.getByLabelText("attrs.license")).toBeTruthy();
    expect(screen.getByText("attrs.capabilities")).toBeTruthy();
  });

  test("boolean select updates AttributeFilterState", async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderFacetBar();

    await user.selectOptions(screen.getByLabelText("Open source"), "true");

    expect(onFiltersChange).toHaveBeenCalledTimes(1);
    expect(onFiltersChange.mock.calls[0]?.[0]).toEqual({
      boolean: { "attr.open-source": true },
    });
  });

  test("string input updates AttributeFilterState", async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderFacetBar();

    await user.type(screen.getByLabelText("Summary"), "loop");

    expect(onFiltersChange.mock.calls.length).toBeGreaterThan(0);
    const last =
      onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1]?.[0];
    expect(last?.string?.["attr.summary"]).toBe("loop");
  });

  test("single-tag select updates AttributeFilterState", async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderFacetBar();

    await user.selectOptions(screen.getByLabelText("License"), "mit");

    expect(onFiltersChange).toHaveBeenCalledTimes(1);
    expect(onFiltersChange.mock.calls[0]?.[0]).toEqual({
      singleTag: { "attr.license": "mit" },
    });
  });

  test("multi-tag checkbox selections accumulate as AND-ready string[]", async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderFacetBar();

    await user.click(screen.getByRole("checkbox", { name: "loop" }));

    expect(onFiltersChange).toHaveBeenCalledTimes(1);
    expect(onFiltersChange.mock.calls[0]?.[0]).toEqual({
      multiTag: { "attr.capabilities": ["loop"] },
    });

    await user.click(screen.getByRole("checkbox", { name: "worktree" }));

    expect(onFiltersChange.mock.calls[1]?.[0]).toEqual({
      multiTag: { "attr.capabilities": ["loop", "worktree"] },
    });
  });

  test("empty / no-filterable-defs renders without throwing", () => {
    renderFacetBar({
      attributeDefs: [
        {
          id: "attr.internal-note",
          labelKey: "attrs.internalNote",
          type: "string",
          filterable: false,
          sortable: false,
        },
      ],
      emptyMessage: "No filterable attributes.",
    });

    const region = screen.getByRole("region", {
      name: "Attribute filters",
    });
    expect(region.getAttribute("data-attribute-facet-empty")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe(
      "No filterable attributes.",
    );
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  test("facet controls are keyboard-focusable and operable", async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderFacetBar();

    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText("Open source"));
    await user.selectOptions(screen.getByLabelText("Open source"), "false");
    expect(onFiltersChange.mock.calls.at(-1)?.[0]).toEqual({
      boolean: { "attr.open-source": false },
    });

    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText("Summary"));
    await user.keyboard("harness");
    expect(
      onFiltersChange.mock.calls.at(-1)?.[0]?.string?.["attr.summary"],
    ).toBe("harness");

    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText("License"));
    await user.selectOptions(screen.getByLabelText("License"), "apache-2.0");
    expect(onFiltersChange.mock.calls.at(-1)?.[0]).toEqual({
      boolean: { "attr.open-source": false },
      string: { "attr.summary": "harness" },
      singleTag: { "attr.license": "apache-2.0" },
    });

    await user.tab();
    const loopCheckbox = screen.getByRole("checkbox", { name: "loop" });
    expect(document.activeElement).toBe(loopCheckbox);
    await user.keyboard(" ");
    expect(onFiltersChange.mock.calls.at(-1)?.[0]).toEqual({
      boolean: { "attr.open-source": false },
      string: { "attr.summary": "harness" },
      singleTag: { "attr.license": "apache-2.0" },
      multiTag: { "attr.capabilities": ["loop"] },
    });
  });

  test("multi-tag group exposes accessible checkbox names for each tag", () => {
    renderFacetBar();

    const capabilities = screen.getByText("Capabilities").closest("fieldset");
    expect(capabilities).toBeTruthy();
    if (!capabilities) {
      throw new Error("expected capabilities fieldset");
    }

    for (const tag of ["loop", "worktree", "compaction", "harness"]) {
      expect(
        within(capabilities).getByRole("checkbox", { name: tag }),
      ).toBeTruthy();
    }
  });
});
