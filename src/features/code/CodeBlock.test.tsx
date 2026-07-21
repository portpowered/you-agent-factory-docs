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
  CodeBlock,
} from "@/features/code/CodeBlock";

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

describe("CodeBlock", () => {
  afterEach(() => {
    cleanup();
    mock.restore();
  });

  test("copy control is findable by accessible name", () => {
    render(<CodeBlock code="you run --named @goal/blah" />);

    expect(
      screen.getByRole("button", { name: CODE_BLOCK_COPY_LABEL }),
    ).toBeTruthy();
  });

  test("activating copy writes the code string to the clipboard", async () => {
    const writeText = installClipboardMock();
    const code = "curl -fsSL https://example.com/install.sh | sh";

    render(<CodeBlock code={code} title="install.sh" />);

    fireEvent.click(
      screen.getByRole("button", { name: CODE_BLOCK_COPY_LABEL }),
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(writeText.mock.calls[0]?.[0]).toBe(code);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: CODE_BLOCK_COPIED_LABEL }),
      ).toBeTruthy();
    });
  });

  test("renders code in pre/code and shows optional title", () => {
    const { rerender } = render(<CodeBlock code="echo hello" title="shell" />);

    expect(screen.getByText("shell")).toBeTruthy();
    expect(document.querySelector("pre code")?.textContent).toBe("echo hello");

    rerender(<CodeBlock code="echo hello" />);
    expect(document.querySelector("[data-code-block-title]")).toBeNull();
    expect(document.querySelector("pre code")?.textContent).toBe("echo hello");
  });
});
