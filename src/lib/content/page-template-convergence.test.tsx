import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const templateRoot = join(process.cwd(), "docs/templates");

type TemplateKind =
  | "model"
  | "paper"
  | "concept"
  | "guide"
  | "technique"
  | "documentation"
  | "system"
  | "training-regime"
  | "glossary";

/**
 * After Atlas graph/chart MDX deletion, templates keep writing-standards
 * convergence without requiring deleted PageAsset/ModuleGraph tags.
 * CLI kinds (guide/technique/documentation) never had graph assets.
 */
const nonModuleTemplates: TemplateKind[] = [
  "model",
  "paper",
  "concept",
  "guide",
  "technique",
  "documentation",
  "training-regime",
  "system",
  "glossary",
];

function readTemplate(kind: TemplateKind): string {
  return readFileSync(join(templateRoot, `${kind}.mdx`), "utf8");
}

function readStarterMessages(kind: TemplateKind): Record<string, unknown> {
  return JSON.parse(
    readFileSync(join(templateRoot, `${kind}.messages.en.json`), "utf8"),
  ) as Record<string, unknown>;
}

describe("non-module page template convergence", () => {
  for (const kind of nonModuleTemplates) {
    test(`${kind}.mdx follows writing standards without deleted Atlas graph tags`, () => {
      const template = readTemplate(kind);

      expect(template).not.toContain('# <T k="title" />');
      expect(template).not.toContain('<T k="problemStatement" />');
      expect(template).not.toContain('<T k="coreIdea" />');
      expect(template).not.toContain("callouts.readerShortcut");

      expect(template).not.toContain("<FoldedSummary />");
      expect(template).not.toContain('<T k="openingSummary" />');
      expect(template).not.toContain("<GlossaryOpening />");

      expect(template).not.toContain("<ModuleGraph");
      expect(template).not.toContain("<RegistryGraphFlow");
      expect(template).not.toContain('from "@/features/models');
    });

    test(`${kind} starter messages omit deprecated summary keys and reader shortcuts`, () => {
      const messages = readStarterMessages(kind);

      expect(messages.problemStatement).toBeUndefined();
      expect(messages.coreIdea).toBeUndefined();
      expect(
        (messages.callouts as { readerShortcut?: unknown } | undefined)
          ?.readerShortcut,
      ).toBeUndefined();
    });
  }
});
