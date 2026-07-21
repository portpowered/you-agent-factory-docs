/**
 * Page-owned render proof for concepts/skills.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the skills bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { resolveConceptsSidebarGroup } from "@/lib/content/sidebar-grouping";
import { source } from "@/lib/source";

describe("skills concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/skills as a harnesses concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "skills"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/skills");

    const indexes = await loadRegistry();
    const skillsRecord = getRegistryRecord(indexes, "concept.skills");
    expect(skillsRecord?.kind).toBe("concept");
    if (skillsRecord?.kind === "concept") {
      expect(resolveConceptsSidebarGroup(skillsRecord)).toBe("harnesses");
      expect(skillsRecord.sidebarGrouping?.concepts).toBeUndefined();
      expect(skillsRecord.aliases).toContain("agent skills");
      expect(skillsRecord.aliases).toContain("Cursor Agent Skills");
      expect(skillsRecord.aliases).toContain("SKILL.md");
      expect(skillsRecord.relatedIds).toContain("concept.harness");
      expect(skillsRecord.relatedIds).toContain("concept.tool");
      expect(skillsRecord.relatedIds).toContain("concept.mcp");
      expect(skillsRecord.relatedIds).toContain("concept.tool-calling");
      expect(skillsRecord.relatedIds).toContain("documentation.mcp");
    }

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "skills",
    });

    expect(loadedPage.messages.title).toBe("Skills");
    expect(loadedPage.messages.description).toMatch(
      /reusable instruction packages/i,
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(/design-skills/i);

    const whatItIs = String(loadedPage.messages.sections?.whatItIs?.body ?? "");
    const whyItMatters = String(
      loadedPage.messages.sections?.whyItMatters?.body ?? "",
    );
    const simpleExample = String(
      loadedPage.messages.sections?.simpleExample?.body ?? "",
    );
    const commonConfusions = String(
      loadedPage.messages.sections?.commonConfusions?.body ?? "",
    );
    expect(whatItIs).toMatch(/reusable instruction package/i);
    expect(whatItIs).toMatch(/harness or coding agent/i);
    expect(whatItIs).toMatch(/SKILL\.md/i);
    expect(whatItIs).toMatch(/not a tool/i);
    expect(whatItIs).toMatch(/Model Context Protocol \(MCP\)/i);
    expect(whatItIs).toMatch(
      /not this documentation site's frontend design-skills/i,
    );
    expect(whyItMatters).toMatch(/load focused guidance/i);
    expect(whyItMatters).toMatch(/repeated workflows stay consistent/i);
    expect(simpleExample).toMatch(/project skill/i);
    expect(simpleExample).toMatch(/Cursor-backed harness/i);
    expect(simpleExample).toMatch(/loaded instruction package/i);
    expect(simpleExample).toMatch(/are tools/i);
    expect(commonConfusions).toMatch(/not a tool/i);
    expect(commonConfusions).toMatch(/not MCP/i);
    expect(commonConfusions).toMatch(/not the harness itself/i);
    expect(commonConfusions).toMatch(/design-skills frontend authoring guide/i);
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);
    expect(whyItMatters).not.toMatch(/on this page|Model Atlas/i);
    expect(simpleExample).not.toMatch(/on this page|Model Atlas/i);
    expect(commonConfusions).not.toMatch(/on this page|Model Atlas/i);

    render(
      <main>
        <DocsPageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Simple Example" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Common Confusions" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    // Prose auto-linking wraps glossary terms in anchors, so prefer section
    // textContent fragments over contiguous getByText sentence matches.
    const whatItIsSection = document.getElementById("what-it-is");
    const whyItMattersSection = document.getElementById("why-it-matters");
    const simpleExampleSection = document.getElementById("simple-example");
    const commonConfusionsSection =
      document.getElementById("common-confusions");
    expect(whatItIsSection?.textContent ?? "").toMatch(
      /reusable instruction package/i,
    );
    expect(whatItIsSection?.textContent ?? "").toMatch(/SKILL\.md/i);
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /load focused guidance/i,
    );
    expect(simpleExampleSection?.textContent ?? "").toMatch(
      /Cursor-backed harness/i,
    );
    expect(simpleExampleSection?.textContent ?? "").toMatch(/are tools/i);
    expect(commonConfusionsSection?.textContent ?? "").toMatch(/not a tool/i);
    expect(commonConfusionsSection?.textContent ?? "").toMatch(/not MCP/i);
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /not the harness itself/i,
    );
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });

  test("ships ja / zh-CN / vi message stubs with concept section structure", async () => {
    const en = await loadLocalDocsPage({
      section: "concepts",
      slug: "skills",
    });
    const ja = await loadLocalDocsPage(
      { section: "concepts", slug: "skills" },
      "ja",
    );
    const zhCN = await loadLocalDocsPage(
      { section: "concepts", slug: "skills" },
      "zh-CN",
    );
    const vi = await loadLocalDocsPage(
      { section: "concepts", slug: "skills" },
      "vi",
    );

    expect(Object.keys(ja.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(Object.keys(zhCN.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(Object.keys(vi.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(String(ja.messages.sections?.whatItIs?.title ?? "")).toBe(
      "What It Is",
    );
    expect(String(zhCN.messages.sections?.whyItMatters?.title ?? "")).toBe(
      "Why It Matters",
    );
    expect(String(vi.messages.sections?.simpleExample?.title ?? "")).toBe(
      "Simple Example",
    );
    expect(String(ja.messages.sections?.commonConfusions?.title ?? "")).toBe(
      "Common Confusions",
    );
    expect(ja.messages.links).toBeUndefined();
    expect(zhCN.messages.links).toBeUndefined();
    expect(vi.messages.links).toBeUndefined();

    render(
      <main>
        <DocsPageProviders messages={ja.messages} assets={ja.assets}>
          {ja.content}
        </DocsPageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Simple Example" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Common Confusions" }),
    ).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
