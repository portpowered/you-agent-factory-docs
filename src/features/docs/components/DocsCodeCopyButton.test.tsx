import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocsPre } from "@/features/docs/components/DocsCodeBlock";
import {
  DOCS_CODE_COPY_COPIED_LABEL,
  DOCS_CODE_COPY_LABEL,
  DOCS_CODE_COPY_RESET_MS,
  DOCS_CODE_COPY_STATUS_ATTR,
} from "@/features/docs/styles/docs-code-copy-chrome";

function installClipboardMock() {
  const writeText = mock((text: string) => {
    void text;
    return Promise.resolve();
  });
  const clipboard = {
    writeText: (text: string) => writeText(text),
  };
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: clipboard,
  });
  return writeText;
}

describe("DocsCodeCopyButton interaction", () => {
  afterEach(() => {
    cleanup();
    mock.restore();
  });

  test("pointer click copies text, shows checkmark + accessible copied status, then resets", async () => {
    const writeText = installClipboardMock();

    render(
      <DocsPre className="language-sh">{`you run --named @goal/blah`}</DocsPre>,
    );

    const button = screen.getByRole("button", { name: DOCS_CODE_COPY_LABEL });
    expect(
      button.querySelector('[data-docs-code-copy-icon="clipboard"]'),
    ).toBeTruthy();
    expect(button.hasAttribute("data-checked")).toBe(false);

    fireEvent.click(button);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain(
      "you run --named @goal/blah",
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: DOCS_CODE_COPY_COPIED_LABEL }),
      ).toBeTruthy();
    });

    const copiedButton = screen.getByRole("button", {
      name: DOCS_CODE_COPY_COPIED_LABEL,
    });
    expect(copiedButton.hasAttribute("data-checked")).toBe(true);
    expect(
      copiedButton.querySelector('[data-docs-code-copy-icon="check"]'),
    ).toBeTruthy();

    const liveRegion = document.querySelector(
      `[${DOCS_CODE_COPY_STATUS_ATTR}]`,
    );
    expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
    expect(liveRegion?.textContent).toBe(DOCS_CODE_COPY_COPIED_LABEL);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: DOCS_CODE_COPY_LABEL }),
        ).toBeTruthy();
      },
      { timeout: DOCS_CODE_COPY_RESET_MS + 500 },
    );

    const resetButton = screen.getByRole("button", {
      name: DOCS_CODE_COPY_LABEL,
    });
    expect(resetButton.hasAttribute("data-checked")).toBe(false);
    expect(
      resetButton.querySelector('[data-docs-code-copy-icon="clipboard"]'),
    ).toBeTruthy();
    expect(liveRegion?.textContent).toBe("");
  });

  test("keyboard Enter activates copy with the same checkmark and accessible status", async () => {
    // userEvent.setup() may install its own clipboard — mock after setup.
    const user = userEvent.setup();
    const writeText = installClipboardMock();

    render(<DocsPre className="language-sh">{`you docs agents`}</DocsPre>);

    const button = screen.getByRole("button", { name: DOCS_CODE_COPY_LABEL });
    expect(button.getAttribute("type")).toBe("button");
    button.focus();
    expect(document.activeElement).toBe(button);

    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(writeText.mock.calls.length).toBeGreaterThan(0);
    });
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain(
      "you docs agents",
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: DOCS_CODE_COPY_COPIED_LABEL }),
      ).toBeTruthy();
    });
    expect(
      screen
        .getByRole("button", { name: DOCS_CODE_COPY_COPIED_LABEL })
        .querySelector('[data-docs-code-copy-icon="check"]'),
    ).toBeTruthy();
  });

  test("keyboard Space activates copy (touch taps share the same click path)", async () => {
    const user = userEvent.setup();
    const writeText = installClipboardMock();

    render(<DocsPre className="language-sh">{`echo touch-ok`}</DocsPre>);

    const button = screen.getByRole("button", { name: DOCS_CODE_COPY_LABEL });
    button.focus();
    await user.keyboard(" ");

    await waitFor(() => {
      expect(writeText.mock.calls.length).toBeGreaterThan(0);
    });
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain(
      "echo touch-ok",
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: DOCS_CODE_COPY_COPIED_LABEL }),
      ).toBeTruthy();
    });
  });

  test("excludes marked ignore regions from clipboard text", async () => {
    const writeText = installClipboardMock();

    render(
      <DocsPre className="language-sh">
        keep-me
        <span className="nd-copy-ignore">secret-ignore</span>
        after
      </DocsPre>,
    );

    fireEvent.click(screen.getByRole("button", { name: DOCS_CODE_COPY_LABEL }));

    await waitFor(() => {
      expect(writeText.mock.calls.length).toBeGreaterThan(0);
    });

    const copied = String(writeText.mock.calls[0]?.[0] ?? "");
    expect(copied).toContain("keep-me");
    expect(copied).toContain("after");
    expect(copied).not.toContain("secret-ignore");
  });
});
