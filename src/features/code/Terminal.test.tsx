import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  CODE_BLOCK_COPIED_LABEL,
  CODE_BLOCK_COPY_LABEL,
} from "@/features/code/CodeBlock";
import { Terminal } from "@/features/code/Terminal";

function installClipboardMock() {
  const writeText = mock((text: string) => {
    void text;
    return Promise.resolve();
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: {
      writeText: (text: string) => writeText(text),
    },
  });
  return writeText;
}

describe("Terminal", () => {
  afterEach(() => {
    cleanup();
    mock.restore();
  });

  test("copy control is findable by accessible name", () => {
    render(<Terminal lines={["you run --named @goal/blah"]} />);

    expect(
      screen.getByRole("button", { name: CODE_BLOCK_COPY_LABEL }),
    ).toBeTruthy();
  });

  test("activating copy writes the joined line text to the clipboard", async () => {
    const writeText = installClipboardMock();
    const lines = [
      "curl -fsSL https://example.com/install.sh | sh",
      "you run --named @goal/blah",
    ];

    render(
      <Terminal lines={lines} chips={["bash", "zsh"]} variant="install" />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: CODE_BLOCK_COPY_LABEL }),
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(writeText.mock.calls[0]?.[0]).toBe(lines.join("\n"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: CODE_BLOCK_COPIED_LABEL }),
      ).toBeTruthy();
    });
  });

  test("renders chips chrome and keeps each line visible", () => {
    render(
      <Terminal
        lines={["line-one", "line-two"]}
        chips={["Install", "Run"]}
        variant="dark"
      />,
    );

    expect(screen.getByText("Install")).toBeTruthy();
    expect(screen.getByText("Run")).toBeTruthy();
    expect(
      document.querySelector("[data-terminal-body] code")?.textContent,
    ).toBe("line-one\nline-two");
  });

  test("install and dark variants remain visually distinct via markers", () => {
    const { rerender } = render(
      <Terminal lines={["echo install"]} variant="install" />,
    );

    const installRoot = document.querySelector("[data-terminal]");
    expect(installRoot?.getAttribute("data-terminal-variant")).toBe("install");
    expect(installRoot?.className).toContain(
      "bg-[var(--docs-chrome-primary-yellow)]",
    );

    rerender(<Terminal lines={["echo dark"]} variant="dark" />);
    const darkRoot = document.querySelector("[data-terminal]");
    expect(darkRoot?.getAttribute("data-terminal-variant")).toBe("dark");
    expect(darkRoot?.className).toContain("bg-zinc-950");
    expect(darkRoot?.className).toContain("rounded-3xl");
    expect(darkRoot?.className).not.toContain(
      "bg-[var(--docs-chrome-primary-yellow)]",
    );
  });

  test("renders cleanly when chips are omitted", () => {
    render(<Terminal lines={["solo"]} />);

    expect(document.querySelector("[data-terminal-chips]")).toBeNull();
    expect(screen.getByText("solo")).toBeTruthy();
  });
});
