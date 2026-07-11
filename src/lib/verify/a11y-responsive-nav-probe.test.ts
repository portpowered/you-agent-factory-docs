import { afterEach, describe, expect, test } from "bun:test";
import { probePrimaryNavUsability } from "./a11y-responsive-nav-probe";

describe("probePrimaryNavUsability", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("reports inline primary nav links", () => {
    document.body.innerHTML = `
      <header>
        <nav aria-label="Primary">
          <a href="/">Home</a>
          <a href="/browse">Browse</a>
        </nav>
      </header>
    `;

    const probe = probePrimaryNavUsability(document, "inline");
    expect(probe.hasPrimaryNavigation).toBe(true);
    expect(probe.primaryLinkCount).toBe(2);
    expect(probe.primaryLinkLabels).toEqual(["Home", "Browse"]);
  });

  test("reports drawer menu control and expanded primary nav", () => {
    document.body.innerHTML = `
      <header>
        <button type="button" aria-label="Menu" aria-expanded="true" aria-controls="drawer">
          Menu
        </button>
        <aside id="drawer" role="dialog">
          <nav aria-label="Primary">
            <a href="/">Home</a>
            <a href="/docs">Docs</a>
            <a href="/blog">Blog</a>
          </nav>
        </aside>
      </header>
    `;

    const probe = probePrimaryNavUsability(document, "drawer");
    expect(probe.hasMenuButton).toBe(true);
    expect(probe.menuButtonLabel).toBe("Menu");
    expect(probe.menuButtonExpanded).toBe(true);
    expect(probe.hasPrimaryNavigation).toBe(true);
    expect(probe.primaryLinkCount).toBe(3);
  });
});
