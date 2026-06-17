import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { CodeBlock } from "../../src/components/docs/primitives/code-block";
import { formatCodeBlockLanguageLabel } from "../../src/lib/docs-primitives";

describe("formatCodeBlockLanguageLabel", () => {
  test("maps known language slugs to reviewer-visible labels", () => {
    expect(formatCodeBlockLanguageLabel("bash")).toBe("Bash");
    expect(formatCodeBlockLanguageLabel("powershell")).toBe("PowerShell");
  });

  test("preserves unknown language slugs", () => {
    expect(formatCodeBlockLanguageLabel("rust")).toBe("rust");
  });
});

describe("CodeBlock primitive", () => {
  test("renders visible code content with a human-readable language label", () => {
    render(<CodeBlock code={"echo hello\n"} language="bash" />);

    expect(screen.getByText("echo hello")).toBeTruthy();
    expect(screen.getByText("Bash")).toBeTruthy();
    expect(screen.getByRole("figure", { name: "Bash" })).toBeTruthy();
  });

  test("sets the lang attribute on the code element", () => {
    render(<CodeBlock code="const x = 1;" language="typescript" />);

    const code = screen.getByText("const x = 1;");
    expect(code.getAttribute("lang")).toBe("typescript");
    expect(code.className).toContain("language-typescript");
  });

  test("uses a custom title label when provided", () => {
    render(
      <CodeBlock
        code="factory run --help"
        language="bash"
        title="Install command"
      />,
    );

    expect(
      screen.getByRole("figure", { name: "Install command" }),
    ).toBeTruthy();
    expect(screen.queryByText("Bash")).toBeNull();
  });

  test("exposes an accessible name when no visible label is provided", () => {
    render(<CodeBlock code="plain text" />);

    expect(screen.getByRole("figure", { name: "Code example" })).toBeTruthy();
  });

  test("applies responsive layout classes for scrollable code presentation", () => {
    const { container } = render(
      <CodeBlock code="a very long line of code" language="bash" />,
    );

    const figure = container.querySelector(".docs-code-block");
    const pre = container.querySelector(".docs-code-block__pre");

    expect(figure).toBeTruthy();
    expect(pre?.className).toContain("docs-code-block__pre");
  });
});
