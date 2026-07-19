import { afterEach, describe, expect, test } from "bun:test";
import {
  evaluateReferenceNoJsHtmlInBrowser,
  expectReferenceNoJsHtmlReadability,
  isReadableApiOperationSection,
  listReferenceNoJsFactsForRoute,
  listRequiredReferenceNoJsFacts,
  probeReferenceNoJsFact,
  REFERENCE_NO_JS_FACTS,
  REFERENCE_NO_JS_ROUTE_IDS,
  referenceNoJsHtmlEvaluateArgs,
  stripScriptsFromHtml,
} from "./a11y-reference-no-js-html-contract";
import { REFERENCE_SURFACE_ROUTE_IDS } from "./a11y-reference-surface-contract";

describe("a11y-reference-no-js-html-contract", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("enumerates essential facts for all six representative routes", () => {
    expect([...REFERENCE_NO_JS_ROUTE_IDS]).toEqual([
      ...REFERENCE_SURFACE_ROUTE_IDS,
    ]);

    const kinds = new Set(REFERENCE_NO_JS_FACTS.map((entry) => entry.kind));
    expect(kinds.has("api-operation")).toBe(true);
    expect(kinds.has("event-identity")).toBe(true);
    expect(kinds.has("event-heading")).toBe(true);
    expect(kinds.has("schema-field")).toBe(true);
    expect(kinds.has("schema-type")).toBe(true);

    expect(
      listRequiredReferenceNoJsFacts("references-api").map((entry) => entry.id),
    ).toEqual(["api-operation-method-path-summary"]);
    expect(
      listRequiredReferenceNoJsFacts("references-events").map(
        (entry) => entry.id,
      ),
    ).toEqual([
      "event-type-identity",
      "event-envelope-heading",
      "event-payload-heading",
    ]);
    expect(
      listRequiredReferenceNoJsFacts("references-factory-schema").map(
        (entry) => entry.id,
      ),
    ).toEqual(["schema-field-name", "schema-field-type"]);
    expect(
      listRequiredReferenceNoJsFacts("authored-factory").map(
        (entry) => entry.id,
      ),
    ).toEqual(["schema-field-name", "schema-field-type"]);
  });

  test("stripScriptsFromHtml removes executable script tags", () => {
    const html = `
      <html><head>
        <script src="/_next/static/chunks/app.js"></script>
        <script>window.__BOOT=1</script>
      </head><body>
        <main><p data-keep="yes">hello</p></main>
        <script type="module">import x from "y"</script>
      </body></html>
    `;
    const stripped = stripScriptsFromHtml(html);
    expect(stripped).not.toContain("<script");
    expect(stripped).toContain('data-keep="yes"');
    expect(stripped).toContain("hello");
  });

  test("API operation sections require method, path, and summary", () => {
    document.body.innerHTML = `
      <section data-api-operation-section=""
        data-api-operation-method="post"
        data-api-operation-path="/factory-sessions/{session_id}/work">
        <p data-api-operation-summary="">Submit work for one session</p>
      </section>
    `;
    const section = document.querySelector("[data-api-operation-section]");
    expect(section).toBeTruthy();
    if (!section) {
      return;
    }
    expect(isReadableApiOperationSection(section)).toBe(true);

    const probe = expectReferenceNoJsHtmlReadability(
      document,
      "references-api",
    );
    expect(probe.ok).toBe(true);
    expect(probe.scriptsAbsent).toBe(true);
    const api = probe.facts.find(
      (entry) => entry.id === "api-operation-method-path-summary",
    );
    expect(api?.readableHitCount).toBe(1);
    expect(api?.sampleTexts[0]).toContain("post");
    expect(api?.sampleTexts[0]).toContain("/factory-sessions");
  });

  test("fails when API summary is missing from static HTML", () => {
    document.body.innerHTML = `
      <section data-api-operation-section=""
        data-api-operation-method="get"
        data-api-operation-path="/health">
        <p>No heading or summary marker</p>
      </section>
    `;
    expect(() =>
      expectReferenceNoJsHtmlReadability(document, "references-api"),
    ).toThrow(/api-operation-method-path-summary/);
  });

  test("Fumadocs-primary sections pass via method/path/summary data attributes", () => {
    document.body.innerHTML = `
      <section data-api-operation-section=""
        data-api-fumadocs-operation="submitWorkBySessionId"
        data-api-operation-method="post"
        data-api-operation-path="/factory-sessions/{session_id}/work"
        data-api-operation-summary="Submit work">
        <div data-api-operation-path-token="">
          <code class="overflow-auto">/factory-sessions/{session_id}/work</code>
        </div>
        <h2>Submit work</h2>
      </section>
    `;
    const section = document.querySelector("[data-api-operation-section]");
    expect(section).toBeTruthy();
    if (!section) {
      return;
    }
    expect(isReadableApiOperationSection(section)).toBe(true);

    const probe = expectReferenceNoJsHtmlReadability(
      document,
      "references-api",
    );
    expect(probe.ok).toBe(true);
    const api = probe.facts.find(
      (entry) => entry.id === "api-operation-method-path-summary",
    );
    expect(api?.readableHitCount).toBe(1);
    expect(api?.sampleTexts[0]).toContain("Submit work");
  });

  test("events type identity and envelope/payload headings pass", () => {
    document.body.innerHTML = `
      <section data-event-envelope="FactoryEvent">
        <h2>FactoryEvent envelope</h2>
      </section>
      <article data-event-payload-only="true" data-event-type="AGENT_RUN_RESPONSE">
        <h3 id="event-payload-AGENT_RUN_RESPONSE-heading">
          <code>AGENT_RUN_RESPONSE</code>
        </h3>
      </article>
    `;
    const probe = expectReferenceNoJsHtmlReadability(
      document,
      "references-events",
    );
    expect(probe.ok).toBe(true);
    expect(
      probe.facts.find((entry) => entry.id === "event-type-identity")
        ?.sampleTexts[0],
    ).toBe("AGENT_RUN_RESPONSE");
  });

  test("schema field name and type summaries pass for factory-schema", () => {
    document.body.innerHTML = `
      <div>
        <span data-schema-field-name="">factoryDirectory</span>
        <span data-schema-type="summary">string</span>
      </div>
    `;
    const probe = expectReferenceNoJsHtmlReadability(
      document,
      "references-factory-schema",
    );
    expect(probe.ok).toBe(true);
    expect(
      listReferenceNoJsFactsForRoute("authored-worker").map((s) => s.id),
    ).toEqual(["schema-field-name", "schema-field-type"]);
  });

  test("probe reports empty hits when selectors miss", () => {
    document.body.innerHTML = `<main><p>no contract chrome</p></main>`;
    const spec = listRequiredReferenceNoJsFacts("references-api")[0];
    expect(spec).toBeDefined();
    if (!spec) {
      return;
    }
    const probe = probeReferenceNoJsFact(document, spec);
    expect(probe.found).toBe(false);
    expect(probe.ok).toBe(false);
  });

  test("evaluate args and browser probe mirror the contract", () => {
    document.body.innerHTML = `
      <section data-api-operation-section=""
        data-api-operation-method="post"
        data-api-operation-path="/x">
        <p data-api-operation-summary="">Do x</p>
      </section>
    `;
    const args = referenceNoJsHtmlEvaluateArgs("references-api");
    expect(args.routeId).toBe("references-api");
    expect(args.facts[0]?.id).toBe("api-operation-method-path-summary");

    const result = evaluateReferenceNoJsHtmlInBrowser(args);
    expect(result.ok).toBe(true);
    expect(result.scriptsAbsent).toBe(true);
    expect(result.facts[0]?.readableHitCount).toBe(1);
  });
});
