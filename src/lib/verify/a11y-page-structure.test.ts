import { describe, expect, test } from "bun:test";
import {
  expectCriticalPageStructure,
  listKeyboardFocusableControls,
  probePageLandmarks,
} from "./a11y-page-structure";

describe("a11y-page-structure probes", () => {
  test("detects banner, primary or landing nav, main, and heading outline", () => {
    document.body.innerHTML = `
      <header>
        <nav aria-label="Primary">
          <a href="/">Home</a>
          <a href="/browse">Browse</a>
        </nav>
        <button type="button" aria-label="Open search">Search</button>
      </header>
      <main>
        <h1>you-agent-factory</h1>
        <h2>Install</h2>
        <a href="/docs/guides/getting-started">Getting started</a>
      </main>
    `;

    const probe = probePageLandmarks(document);
    expect(probe.hasBanner).toBe(true);
    expect(probe.hasPrimaryNavigation).toBe(true);
    expect(probe.hasMain).toBe(true);
    expect(probe.h1Count).toBe(1);
    expect(probe.h1Texts).toEqual(["you-agent-factory"]);
    expect(probe.headingLevels).toEqual([1, 2]);

    expectCriticalPageStructure(document, {
      expectedH1: "you-agent-factory",
    });

    const controls = listKeyboardFocusableControls(document);
    expect(controls.map((c) => c.name)).toEqual([
      "Home",
      "Browse",
      "Open search",
      "Getting started",
    ]);
  });

  test("treats Landing nav as site navigation for production home", () => {
    document.body.innerHTML = `
      <header data-landing-header="">
        <nav aria-label="Landing">
          <a href="/browse">Browse</a>
          <a href="/docs/guides">Guides</a>
        </nav>
      </header>
      <main data-landing-main="">
        <h1>Agent factory workflows that stay persistent</h1>
      </main>
    `;

    const probe = probePageLandmarks(document);
    expect(probe.hasBanner).toBe(true);
    expect(probe.hasPrimaryNavigation).toBe(true);
    expect(probe.hasMain).toBe(true);
    expectCriticalPageStructure(document, {
      expectedH1: "Agent factory workflows that stay persistent",
    });
  });

  test("resolves accessible names from label[for] associations", () => {
    document.body.innerHTML = `
      <header>
        <nav aria-label="Primary"><a href="/">Home</a></nav>
      </header>
      <main>
        <h1>Search</h1>
        <label for="search-page-input">Search you-agent-factory…</label>
        <input id="search-page-input" type="search" />
      </main>
    `;

    const controls = listKeyboardFocusableControls(document);
    expect(controls.map((c) => c.name)).toEqual([
      "Home",
      "Search you-agent-factory…",
    ]);
  });

  test("expectCriticalPageStructure fails when main is missing", () => {
    document.body.innerHTML = `
      <header>
        <nav aria-label="Primary"><a href="/">Home</a></nav>
      </header>
      <div><h1>Title</h1></div>
    `;
    expect(() => expectCriticalPageStructure(document)).toThrow(
      /main landmark/,
    );
  });
});
