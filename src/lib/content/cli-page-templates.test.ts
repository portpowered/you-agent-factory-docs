import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pageFrontmatterSchema, pageKindSchema } from "./schemas";
import { parseYamlFrontmatterBlock } from "./yaml-frontmatter";

const templateRoot = join(process.cwd(), "docs/templates");

const cliTemplateKinds = [
  "guide",
  "concept",
  "technique",
  "documentation",
  "reference",
] as const;

const expectedRegistryIdPrefix: Record<
  (typeof cliTemplateKinds)[number],
  string
> = {
  guide: "guide.",
  concept: "concept.",
  technique: "technique.",
  documentation: "documentation.",
  reference: "reference.",
};

const requiredSidecars = [
  ".mdx",
  ".messages.en.json",
  ".assets.json",
  ".content.md",
] as const;

function readTemplateFrontmatter(kind: string) {
  const mdx = readFileSync(join(templateRoot, `${kind}.mdx`), "utf8");
  const match = mdx.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  expect(match?.[1]).toBeTruthy();
  return parseYamlFrontmatterBlock(match?.[1] ?? "");
}

describe("CLI page templates under docs/templates", () => {
  for (const kind of cliTemplateKinds) {
    test(`${kind} template sidecars exist with production-shaped contract`, () => {
      for (const suffix of requiredSidecars) {
        expect(existsSync(join(templateRoot, `${kind}${suffix}`))).toBe(true);
      }

      const mdx = readFileSync(join(templateRoot, `${kind}.mdx`), "utf8");
      expect(mdx).not.toContain("callouts.readerShortcut");
      expect(mdx).not.toContain('<T k="problemStatement" />');
      expect(mdx).not.toContain('<T k="coreIdea" />');
      expect(mdx).not.toContain('# <T k="title" />');

      const contentGuide = readFileSync(
        join(templateRoot, `${kind}.content.md`),
        "utf8",
      );
      expect(contentGuide.length).toBeGreaterThan(0);
      expect(mdx).not.toContain("Authoring Guide");
    });

    test(`${kind} template frontmatter kind validates against Zod page schemas`, () => {
      expect(pageKindSchema.safeParse(kind).success).toBe(true);

      const frontmatter = readTemplateFrontmatter(kind);
      const parsed = pageFrontmatterSchema.safeParse(frontmatter);

      expect(parsed.success).toBe(true);
      if (!parsed.success) {
        return;
      }

      expect(parsed.data.kind).toBe(kind);
      expect(
        parsed.data.registryId.startsWith(expectedRegistryIdPrefix[kind]),
      ).toBe(true);
    });
  }

  test("CLI templates keep isolation-first section order before related", () => {
    const sectionOrderByKind: Record<
      (typeof cliTemplateKinds)[number],
      string[]
    > = {
      guide: [
        "what-it-is",
        "when-to-use",
        "steps-or-workflow",
        "common-pitfalls",
        "related",
      ],
      concept: [
        "what-it-is",
        "why-it-matters",
        "simple-example",
        "common-confusions",
        "related",
      ],
      technique: [
        "what-it-is",
        "why-it-matters",
        "how-it-works",
        "compared-to-nearby-techniques",
        "related",
      ],
      documentation: [
        "what-it-covers",
        "key-concepts",
        "how-to-use",
        "limits-and-assumptions",
        "related",
      ],
      reference: [
        "what-it-covers",
        "key-concepts",
        "how-to-use",
        "limits-and-assumptions",
        "related",
      ],
    };

    for (const kind of cliTemplateKinds) {
      const mdx = readFileSync(join(templateRoot, `${kind}.mdx`), "utf8");
      const sectionIds = [
        ...mdx.matchAll(/<Section\b[^>]*\bid="([^"]+)"/g),
      ].map((match) => match[1]);
      const expected = sectionOrderByKind[kind];
      expect(sectionIds.slice(0, expected.length)).toEqual(expected);
    }
  });
});
