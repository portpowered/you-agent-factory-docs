import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  applyProviderParameter,
  HeroCommandPanel,
  type HeroModelProvider,
} from "./HeroCommandPanel";

const PROVIDERS = [
  {
    id: "claude",
    label: "Claude",
    parameter: "--provider claude",
  },
  {
    id: "codex",
    label: "Codex",
    parameter: "--provider codex",
  },
] as const satisfies readonly HeroModelProvider[];

const INSTALL_COMMAND = "curl installer | sh";
const GOAL_COMMAND = 'you run -a "u/goal" --to "build site, no mistakes"';

function renderPanel() {
  return render(
    <HeroCommandPanel
      goalCommand={GOAL_COMMAND}
      installCommand={INSTALL_COMMAND}
      providers={PROVIDERS}
    />,
  );
}

describe("HeroCommandPanel", () => {
  afterEach(cleanup);

  test("renders install and provider-aware goal commands as two rows", () => {
    const { container } = renderPanel();

    expect(container.querySelectorAll("[data-command-row]")).toHaveLength(2);
    expect(
      container.querySelector('[data-command-row="install"] span')?.textContent,
    ).toBe(INSTALL_COMMAND);
    expect(
      container.querySelector("[data-command-operator]")?.textContent,
    ).toBe("&&");
    expect(
      screen.getByText(
        'you run -a "u/goal" --to "build site, no mistakes" --provider claude',
      ),
    ).toBeTruthy();
  });

  test("updates the goal row when a model provider is selected", async () => {
    const user = userEvent.setup();
    renderPanel();

    const codex = screen.getByRole("button", { name: "Codex" });
    await user.click(codex);

    expect(
      screen.getByText(
        'you run -a "u/goal" --to "build site, no mistakes" --provider codex',
      ),
    ).toBeTruthy();
    expect(codex.getAttribute("aria-pressed")).toBe("true");
  });

  test("copies both aspirational commands with the selected provider", async () => {
    const user = userEvent.setup();
    const writeText = mock(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Codex" }));
    await user.click(
      screen.getByRole("button", { name: "Copy hero commands" }),
    );

    expect(writeText).toHaveBeenCalledWith(
      `${INSTALL_COMMAND} && you run -a "u/goal" --to "build site, no mistakes" --provider codex`,
    );
  });

  test("appends the aspirational provider parameter", () => {
    expect(applyProviderParameter(GOAL_COMMAND, "--provider agy")).toBe(
      'you run -a "u/goal" --to "build site, no mistakes" --provider agy',
    );
  });

  test("switches the install command between macOS/Linux and Windows", async () => {
    const user = userEvent.setup();
    renderPanel();

    const windows = screen.getByRole("button", { name: "Windows" });
    await user.click(windows);

    expect(
      document.querySelector('[data-command-row="install"] span')?.textContent,
    ).toBe("irm https://youagentfactory.com/install.ps1 | iex");
    expect(document.querySelector("[data-command-operator]")?.textContent).toBe(
      "&&",
    );
    expect(windows.getAttribute("aria-pressed")).toBe("true");
  });
});
