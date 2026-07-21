import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { useTheme } from "next-themes";
import { AppProviders } from "@/features/providers/app-providers";
import { loadUiMessages } from "@/lib/content/ui-messages";

function ThemeProbe() {
  const theme = useTheme();
  return (
    <span data-testid="theme-probe">
      {`${theme.theme ?? "unset"}|forced:${String(theme.forcedTheme ?? "")}`}
    </span>
  );
}

function SearchProbe() {
  const search = useSearchContext();
  return (
    <span data-testid="search-probe">
      {`enabled:${String(search.enabled)}|setOpen:${typeof search.setOpenSearch}`}
    </span>
  );
}

describe("AppProviders", () => {
  afterEach(() => {
    cleanup();
  });

  test("forces dark theme and wires an enabled search dialog for children", async () => {
    const messages = await loadUiMessages();

    render(
      <AppProviders metaByUrl={{}} messages={messages}>
        <div data-testid="child">bootstrap-child</div>
        <ThemeProbe />
        <SearchProbe />
      </AppProviders>,
    );

    expect(screen.getByTestId("child").textContent).toBe("bootstrap-child");
    expect(screen.getByTestId("theme-probe").textContent).toContain("dark");
    expect(screen.getByTestId("theme-probe").textContent).toContain(
      "forced:dark",
    );
    expect(screen.getByTestId("search-probe").textContent).toBe(
      "enabled:true|setOpen:function",
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
