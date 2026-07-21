import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  CopyableReferenceAnchor,
  REFERENCE_ANCHOR_COPIED_LABEL,
  REFERENCE_ANCHOR_COPY_LABEL,
} from "./CopyableReferenceAnchor";
import { ReferenceInventoryFilter } from "./ReferenceInventoryFilter";
import {
  createReferenceInventoryFilterState,
  type ReferenceInventoryFilterState,
} from "./reference-inventory-filter";

afterEach(() => {
  cleanup();
  mock.restore();
});

describe("CopyableReferenceAnchor", () => {
  test("exposes a stable fragment link and copy control", () => {
    const { container } = render(
      <CopyableReferenceAnchor anchor="you-config-init" family="cli" />,
    );

    const root = container.querySelector("[data-reference-copyable-anchor]");
    expect(root?.getAttribute("data-reference-anchor")).toBe("you-config-init");
    expect(
      screen
        .getByRole("link", { name: "#you-config-init" })
        .getAttribute("href"),
    ).toBe("#you-config-init");
    expect(
      screen.getByRole("button", { name: REFERENCE_ANCHOR_COPY_LABEL }),
    ).toBeTruthy();
  });

  test("copies the owning-page anchor URL from W04 search helpers", async () => {
    const writeText = mock((text: string) => {
      void text;
      return Promise.resolve();
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      writable: true,
      value: { writeText: (text: string) => writeText(text) },
    });

    render(<CopyableReferenceAnchor anchor="you-config-init" family="cli" />);

    fireEvent.click(
      screen.getByRole("button", { name: REFERENCE_ANCHOR_COPY_LABEL }),
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "/docs/references/cli#you-config-init",
      );
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: REFERENCE_ANCHOR_COPIED_LABEL }),
      ).toBeTruthy();
    });
  });
});

function FilterHarness({
  initial = createReferenceInventoryFilterState(),
}: {
  initial?: ReferenceInventoryFilterState;
}) {
  const [filter, setFilter] = useState(initial);
  return (
    <ReferenceInventoryFilter
      filter={filter}
      legend="Filter CLI commands"
      onFilterChange={setFilter}
      publishedVisibilities={["visible", "internal"]}
      queryLabel="Command path"
      resultCount={1}
      totalCount={3}
    />
  );
}

describe("ReferenceInventoryFilter", () => {
  test("is keyboard accessible and reports filter changes", async () => {
    const user = userEvent.setup();
    render(<FilterHarness />);

    const query = screen.getByLabelText("Command path");
    fireEvent.change(query, { target: { value: "config" } });
    expect((query as HTMLInputElement).value).toBe("config");

    await user.selectOptions(screen.getByLabelText("Lifecycle"), "deprecated");
    expect(
      (screen.getByLabelText("Lifecycle") as HTMLSelectElement).value,
    ).toBe("deprecated");

    await user.selectOptions(screen.getByLabelText("Visibility"), "internal");
    expect(
      (screen.getByLabelText("Visibility") as HTMLSelectElement).value,
    ).toBe("internal");

    expect(screen.getByText("Showing 1 of 3")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(
      (screen.getByLabelText("Command path") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (screen.getByLabelText("Lifecycle") as HTMLSelectElement).value,
    ).toBe("all");
  });
});
