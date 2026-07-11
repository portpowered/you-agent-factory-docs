import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DOCS_CODE_BLOCK_INSET_INLINE,
  DocsPre,
} from "@/features/docs/components/DocsCodeBlock";
import {
  DOCS_CODE_COPY_BUTTON_CLASS,
  DOCS_CODE_COPY_CONTROL_ATTR,
  DOCS_CODE_COPY_CONTROL_VALUE,
  DOCS_CODE_COPY_LABEL,
  DOCS_CODE_COPY_STATUS_ATTR,
} from "@/features/docs/styles/docs-code-copy-chrome";

describe("DocsCodeBlock", () => {
  test("renders fenced code with rich-content scroll marker on the viewport region", () => {
    const html = renderToStaticMarkup(
      <DocsPre className="language-python">{`loss.backward()`}</DocsPre>,
    );

    expect(html).toContain('data-rich-content-scroll="code"');
    expect(html).toContain('role="region"');
    expect(html).toContain("overflow-auto");
  });

  test("uses a dedicated copy rail instead of an absolute overlay on untitled blocks", () => {
    const html = renderToStaticMarkup(
      <DocsPre className="language-sh">
        {`curl -fsSL https://example.invalid/very-long-install-script-path-that-should-scroll-horizontally-inside-its-viewport | sh`}
      </DocsPre>,
    );

    expect(html).toContain('data-docs-code-actions="rail"');
    expect(html).toContain("docs-code-block__actions");
    expect(html).toContain("docs-code-block__viewport");
    expect(html).toContain('class="docs-code-block');
    // Overlay placement must not remain on the actions wrapper.
    expect(html).not.toMatch(/data-docs-code-actions="rail"[^>]*\babsolute\b/);
    expect(html).not.toContain("absolute top-3 right-2");
  });

  test("applies shared left/right inset padding on the code viewport", () => {
    const html = renderToStaticMarkup(
      <DocsPre className="language-sh">{`you run --named @goal/blah`}</DocsPre>,
    );

    expect(html).toContain(`padding-inline:${DOCS_CODE_BLOCK_INSET_INLINE}`);
    // No overlay reservation — rail owns copy space; line padding vars stay zeroed.
    expect(html).toContain("--padding-left:0px");
    expect(html).toContain("--padding-right:0px");
    expect(html).not.toContain("--padding-right:calc(var(--spacing) * 8)");
  });

  test("keeps the copy control button inside the reserved rail", () => {
    const html = renderToStaticMarkup(
      <DocsPre className="language-sh">{`echo hello`}</DocsPre>,
    );

    const railIndex = html.indexOf('data-docs-code-actions="rail"');
    const buttonIndex = html.indexOf(`aria-label="${DOCS_CODE_COPY_LABEL}"`);
    const viewportIndex = html.indexOf('data-rich-content-scroll="code"');

    expect(railIndex).toBeGreaterThanOrEqual(0);
    expect(buttonIndex).toBeGreaterThan(railIndex);
    expect(viewportIndex).toBeGreaterThan(buttonIndex);
  });

  test("renders the host copy control with secondary chrome markers and live status", () => {
    const html = renderToStaticMarkup(
      <DocsPre className="language-sh">{`you docs agents`}</DocsPre>,
    );

    expect(html).toContain(
      `${DOCS_CODE_COPY_CONTROL_ATTR}="${DOCS_CODE_COPY_CONTROL_VALUE}"`,
    );
    expect(html).toContain(DOCS_CODE_COPY_BUTTON_CLASS);
    expect(html).toContain(`aria-label="${DOCS_CODE_COPY_LABEL}"`);
    expect(html).toContain(`${DOCS_CODE_COPY_STATUS_ATTR}=""`);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('data-docs-code-copy-icon="clipboard"');
    // Control stays in the DOM at rest (not hover-gated markup).
    const copyIndex = html.indexOf(DOCS_CODE_COPY_BUTTON_CLASS);
    expect(copyIndex).toBeGreaterThanOrEqual(0);
  });
});
