import { afterEach, describe, expect, test } from "bun:test";
import {
  expectNoSeriousAxeViolations,
  expectSeriousAxeViolations,
  getSeriousViolations,
  runAxeOnElement,
} from "./a11y-axe";

describe("a11y-axe serious/critical helpers", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("passes on a minimal accessible landmark region", async () => {
    document.body.innerHTML = `
      <main>
        <h1>Accessible fixture</h1>
        <p>Plain readable copy.</p>
        <a href="/browse">Browse</a>
      </main>
    `;
    const main = document.querySelector("main");
    expect(main).toBeTruthy();
    await expectNoSeriousAxeViolations(main as Element);
  });

  test("getSeriousViolations filters to serious and critical only", async () => {
    document.body.innerHTML = `
      <main>
        <h1>Accessible fixture</h1>
        <img src="/x.png" />
      </main>
    `;
    const main = document.querySelector("main") as Element;
    const results = await runAxeOnElement(main);
    const serious = getSeriousViolations(results);
    for (const violation of serious) {
      expect(
        violation.impact === "serious" || violation.impact === "critical",
      ).toBe(true);
    }
  });

  test("expectSeriousAxeViolations fails when the tree is clean", async () => {
    document.body.innerHTML = `
      <main>
        <h1>Clean</h1>
        <p>No violations expected.</p>
      </main>
    `;
    const main = document.querySelector("main") as Element;
    await expect(expectSeriousAxeViolations(main)).rejects.toThrow(
      /Expected serious axe violations/,
    );
  });
});
