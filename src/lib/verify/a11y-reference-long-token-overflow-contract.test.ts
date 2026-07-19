import { afterEach, describe, expect, test } from "bun:test";
import {
  evaluateReferenceLongTokenOverflowInBrowser,
  expectReferenceLongTokenOverflow,
  isReferenceLongTokenContained,
  listReferenceLongTokenOverflowViewports,
  listReferenceLongTokensForRoute,
  listRequiredReferenceLongTokens,
  probeReferenceLongToken,
  REFERENCE_LONG_TOKEN_OVERFLOW_VIEWPORT_IDS,
  REFERENCE_LONG_TOKENS,
  referenceLongTokenOverflowEvaluateArgs,
} from "./a11y-reference-long-token-overflow-contract";
import { PAGE_OVERFLOW_TOLERANCE_PX } from "./a11y-reference-surface-contract";

function clearDocumentWidthOverrides(): void {
  for (const target of [document.documentElement, document.body]) {
    for (const prop of ["clientWidth", "scrollWidth"] as const) {
      try {
        Reflect.deleteProperty(target, prop);
      } catch {
        // happy-dom may keep native getters; ignore
      }
    }
  }
}

function stubPageWidth(clientWidth: number, scrollWidth: number): void {
  for (const target of [document.documentElement, document.body]) {
    Object.defineProperty(target, "clientWidth", {
      configurable: true,
      get: () => clientWidth,
    });
    Object.defineProperty(target, "scrollWidth", {
      configurable: true,
      get: () => scrollWidth,
    });
  }
}

describe("a11y-reference-long-token-overflow-contract", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    clearDocumentWidthOverrides();
  });

  test("enumerates path/field/enum/code tokens and mobile+zoomed viewports", () => {
    expect([...REFERENCE_LONG_TOKEN_OVERFLOW_VIEWPORT_IDS]).toEqual([
      "mobile",
      "zoomed",
    ]);
    expect(
      listReferenceLongTokenOverflowViewports().map((v) => v.width),
    ).toEqual([390, 512]);

    const kinds = new Set(REFERENCE_LONG_TOKENS.map((entry) => entry.kind));
    expect(kinds.has("path")).toBe(true);
    expect(kinds.has("field")).toBe(true);
    expect(kinds.has("enum")).toBe(true);
    expect(kinds.has("code")).toBe(true);

    expect(
      listRequiredReferenceLongTokens("references-api").map(
        (entry) => entry.id,
      ),
    ).toEqual(["api-operation-path"]);
    expect(
      listRequiredReferenceLongTokens("references-events").map(
        (entry) => entry.id,
      ),
    ).toEqual(["event-stream-path"]);
    expect(
      listRequiredReferenceLongTokens("references-factory-schema").map(
        (entry) => entry.id,
      ),
    ).toEqual(["schema-field-name", "schema-field-path"]);
  });

  test("contained break-all path tokens pass while page overflow stays clean", () => {
    document.body.innerHTML = `
      <main>
        <section data-api-operation-section="">
          <header>
            <h2>
              <code class="break-all">/factory-sessions/{session_id}/workers/{worker_id}/dispatch-with-a-very-long-path-suffix</code>
            </h2>
          </header>
        </section>
      </main>
    `;
    stubPageWidth(390, 390);

    const probe = expectReferenceLongTokenOverflow(document, "references-api");
    expect(probe.ok).toBe(true);
    expect(probe.overflow.page.overflowPx).toBeLessThanOrEqual(
      PAGE_OVERFLOW_TOLERANCE_PX,
    );
    const path = probe.tokens.find(
      (entry) => entry.id === "api-operation-path",
    );
    expect(path?.found).toBe(true);
    expect(path?.allHitsContained).toBe(true);
  });

  test("Fumadocs path-token code with overflow-auto passes containment", () => {
    document.body.innerHTML = `
      <main>
        <section data-api-operation-section="" data-api-fumadocs-operation="op">
          <div data-api-operation-path-token="">
            <code class="flex-1 overflow-auto text-nowrap">/factory-sessions/{session_id}/workers/{worker_id}/dispatch-with-a-very-long-path-suffix</code>
          </div>
        </section>
      </main>
    `;
    stubPageWidth(390, 390);

    const probe = expectReferenceLongTokenOverflow(document, "references-api");
    expect(probe.ok).toBe(true);
    const path = probe.tokens.find(
      (entry) => entry.id === "api-operation-path",
    );
    expect(path?.found).toBe(true);
    expect(path?.containedHitCount).toBeGreaterThan(0);
    expect(path?.allHitsContained).toBe(true);
  });

  test("uncontained long token fails the containment probe", () => {
    document.body.innerHTML = `
      <section data-api-operation-section="">
        <header>
          <h2>
            <code>unbroken-path-without-containment-classes</code>
          </h2>
        </header>
      </section>
    `;
    const code = document.querySelector("code");
    expect(code).not.toBeNull();
    if (!code) {
      return;
    }
    expect(isReferenceLongTokenContained(code)).toBe(false);

    expect(() =>
      expectReferenceLongTokenOverflow(document, "references-api"),
    ).toThrow(/not contained/);
  });

  test("page-level overflow fails even when tokens are wrapped", () => {
    document.body.innerHTML = `
      <section data-api-operation-section="">
        <header>
          <h2><code class="break-all">/sessions/{id}</code></h2>
        </header>
      </section>
    `;
    stubPageWidth(390, 520);

    expect(() =>
      expectReferenceLongTokenOverflow(document, "references-api"),
    ).toThrow(/page-level horizontal overflow/);
  });

  test("intentional scroller containment counts for enum and code tokens", () => {
    document.body.innerHTML = `
      <ul>
        <li data-schema-constraint="enum">
          <code class="min-w-0 overflow-x-auto break-all">alpha | beta | very-long-enum-token-value</code>
        </li>
      </ul>
      <div data-api-example="code" class="overflow-x-auto">
        <pre>curl https://example.test/very-long-unbroken-path-token</pre>
      </div>
      <span data-schema-field-name="" class="break-all">veryLongFieldNameWithoutBreaks</span>
      <code data-schema-field-path-label="" class="truncate max-w-full">a.b.c.very.long.field.path</code>
    `;

    const enumSpec = REFERENCE_LONG_TOKENS.find(
      (entry) => entry.id === "schema-enum",
    );
    const codeSpec = REFERENCE_LONG_TOKENS.find(
      (entry) => entry.id === "api-example-code",
    );
    expect(enumSpec).toBeDefined();
    expect(codeSpec).toBeDefined();
    if (!enumSpec || !codeSpec) {
      return;
    }

    expect(probeReferenceLongToken(document, enumSpec).allHitsContained).toBe(
      true,
    );
    expect(probeReferenceLongToken(document, codeSpec).allHitsContained).toBe(
      true,
    );

    stubPageWidth(512, 512);
    const schemaProbe = expectReferenceLongTokenOverflow(
      document,
      "references-factory-schema",
    );
    expect(schemaProbe.ok).toBe(true);
  });

  test("browser evaluate helper reports missing required tokens", () => {
    document.body.innerHTML = `<main><p>empty</p></main>`;
    const result = evaluateReferenceLongTokenOverflowInBrowser(
      referenceLongTokenOverflowEvaluateArgs("references-api"),
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/api-operation-path|API operation path/);
  });

  test("listReferenceLongTokensForRoute covers authored embed markers", () => {
    const authored = listReferenceLongTokensForRoute("authored-factory");
    expect(
      authored.some((entry) => entry.id === "authored-schema-property-name"),
    ).toBe(true);
    expect(authored.some((entry) => entry.id === "authored-schema-enum")).toBe(
      true,
    );
  });
});
