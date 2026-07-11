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
  DOCS_CODE_COPY_BUTTON_CLASS,
  DOCS_CODE_COPY_CONTROL_ATTR,
  DOCS_CODE_COPY_CONTROL_VALUE,
  DOCS_CODE_COPY_COPIED_LABEL,
  DOCS_CODE_COPY_LABEL,
} from "@/features/docs/styles/docs-code-copy-chrome";
import {
  expectNoSeriousAxeViolations,
  expectSeriousAxeViolations,
} from "@/tests/a11y/axe";
import { A11yTestViolation } from "@/tests/a11y/violation";

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

describe("DocsCodeBlock accessibility", () => {
  afterEach(() => {
    cleanup();
    mock.restore();
  });

  test("copy control is keyboard-reachable with default and copied accessible names", async () => {
    const user = userEvent.setup();
    installClipboardMock();

    render(
      <main>
        <DocsPre className="language-sh">{`you run --named @goal/blah`}</DocsPre>
      </main>,
    );

    const button = screen.getByRole("button", { name: DOCS_CODE_COPY_LABEL });
    expect(button.getAttribute(DOCS_CODE_COPY_CONTROL_ATTR)).toBe(
      DOCS_CODE_COPY_CONTROL_VALUE,
    );
    expect(button.classList.contains(DOCS_CODE_COPY_BUTTON_CLASS)).toBe(true);

    button.focus();
    expect(document.activeElement).toBe(button);

    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: DOCS_CODE_COPY_COPIED_LABEL }),
      ).toBeTruthy();
    });

    const copied = screen.getByRole("button", {
      name: DOCS_CODE_COPY_COPIED_LABEL,
    });
    expect(copied.getAttribute("aria-label")).toBe(DOCS_CODE_COPY_COPIED_LABEL);
    expect(copied.hasAttribute("data-checked")).toBe(true);
  });

  test("representative code-block fixture has no serious axe violations", async () => {
    const { container } = render(
      <main>
        <h1>Code block fixture</h1>
        <DocsPre className="language-sh">
          {`curl -fsSL https://example.invalid/install | sh`}
        </DocsPre>
      </main>,
    );

    expect(
      screen.getByRole("button", { name: DOCS_CODE_COPY_LABEL }),
    ).toBeTruthy();
    await expectNoSeriousAxeViolations(container);
  });

  test("fails axe when a deliberate serious violation is introduced", async () => {
    const { container } = render(
      <main>
        <DocsPre className="language-sh">{`echo axe-negative`}</DocsPre>
        <A11yTestViolation />
      </main>,
    );

    await expectSeriousAxeViolations(container);
  });

  test("copied live region announces without introducing serious axe violations", async () => {
    installClipboardMock();

    const { container } = render(
      <main>
        <h1>Copied status fixture</h1>
        <DocsPre className="language-sh">{`you docs agents`}</DocsPre>
      </main>,
    );

    fireEvent.click(screen.getByRole("button", { name: DOCS_CODE_COPY_LABEL }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: DOCS_CODE_COPY_COPIED_LABEL }),
      ).toBeTruthy();
    });

    await expectNoSeriousAxeViolations(container);
  });
});
