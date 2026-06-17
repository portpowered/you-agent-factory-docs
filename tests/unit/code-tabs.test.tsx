import { describe, expect, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  type CodeTabPanel,
  CodeTabs,
} from "../../src/components/docs/primitives/code-tabs";

const EXAMPLE_PANELS: CodeTabPanel[] = [
  {
    id: "bash",
    label: "Bash",
    language: "bash",
    code: "factory run --repo ./my-service",
  },
  {
    id: "powershell",
    label: "PowerShell",
    language: "powershell",
    code: "factory run --repo .\\my-service",
  },
  {
    id: "typescript",
    label: "TypeScript",
    language: "typescript",
    code: "await factory.run({ repo: './my-service' });",
  },
];

describe("CodeTabs primitive", () => {
  test("renders a labeled tab list with associated tab panels", () => {
    render(
      <CodeTabs label="Install command variants" panels={EXAMPLE_PANELS} />,
    );

    expect(
      screen.getByRole("tablist", { name: "Install command variants" }),
    ).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Bash" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "PowerShell" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "TypeScript" })).toBeTruthy();
    expect(screen.getByRole("tabpanel", { name: "Bash" })).toBeTruthy();
  });

  test("uses roving tabindex so only the active tab stays in tab order", () => {
    render(<CodeTabs panels={EXAMPLE_PANELS} />);

    const bashTab = screen.getByRole("tab", { name: "Bash" });
    const powershellTab = screen.getByRole("tab", { name: "PowerShell" });

    expect(bashTab.getAttribute("tabindex")).toBe("0");
    expect(powershellTab.getAttribute("tabindex")).toBe("-1");
  });

  test("switches visible panels through direct interaction", () => {
    render(<CodeTabs panels={EXAMPLE_PANELS} />);

    const powershellTab = screen.getByRole("tab", { name: "PowerShell" });
    fireEvent.click(powershellTab);

    expect(powershellTab.getAttribute("aria-selected")).toBe("true");
    expect(
      screen.getByRole("tab", { name: "Bash" }).getAttribute("aria-selected"),
    ).toBe("false");

    const powershellPanel = screen.getByRole("tabpanel", {
      name: "PowerShell",
    });
    expect(
      within(powershellPanel).getByText("factory run --repo .\\my-service"),
    ).toBeTruthy();
  });

  test("switches panels with arrow keys and home/end controls", () => {
    render(<CodeTabs panels={EXAMPLE_PANELS} />);

    const bashTab = screen.getByRole("tab", { name: "Bash" });
    bashTab.focus();

    fireEvent.keyDown(bashTab, { key: "ArrowRight" });

    const powershellTab = screen.getByRole("tab", { name: "PowerShell" });
    expect(powershellTab.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(powershellTab);

    fireEvent.keyDown(powershellTab, { key: "End" });

    const typescriptTab = screen.getByRole("tab", { name: "TypeScript" });
    expect(typescriptTab.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(typescriptTab);

    fireEvent.keyDown(typescriptTab, { key: "Home" });

    expect(
      screen.getByRole("tab", { name: "Bash" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(document.activeElement).toBe(bashTab);
  });

  test("renders an explicit empty state when no panels are provided", () => {
    render(<CodeTabs panels={[]} />);

    expect(screen.getByText("No code variants are available.")).toBeTruthy();
    expect(screen.queryByRole("tablist")).toBeNull();
  });
});
