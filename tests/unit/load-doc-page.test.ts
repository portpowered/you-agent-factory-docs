import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadDocPage } from "../../src/lib/content";

describe("loadDocPage", () => {
  test("serves accepted plain markdown locale files through the docs page path", () => {
    const contentRoot = mkdtempSync(join(tmpdir(), "plain-markdown-doc-"));
    const fixtureDir = join(contentRoot, "docs", "plain-markdown");
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      join(fixtureDir, "en.md"),
      `---
id: doc/plain-markdown
kind: doc
title: Plain markdown
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - docs
section: guides
order: 1
---

Plain markdown body content.
`,
    );

    const page = loadDocPage("plain-markdown", contentRoot);

    expect(page.record.id).toBe("doc/plain-markdown");
    expect(page.title).toBe("Plain markdown");
    expect(page.body).toContain("Plain markdown body content.");
  });

  test("prefers mdx locale files when both markdown extensions exist", () => {
    const contentRoot = mkdtempSync(join(tmpdir(), "dual-extension-doc-"));
    const fixtureDir = join(contentRoot, "docs", "dual-extension");
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      join(fixtureDir, "en.md"),
      `---
id: doc/dual-extension
kind: doc
title: Markdown copy
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - docs
section: guides
order: 1
---

Markdown body.
`,
    );
    writeFileSync(
      join(fixtureDir, "en.mdx"),
      `---
id: doc/dual-extension
kind: doc
title: MDX copy
canonicalLocale: en
availableLocales:
  - en
status: published
tags:
  - docs
section: guides
order: 1
---

MDX body.
`,
    );

    const page = loadDocPage("dual-extension", contentRoot);

    expect(page.title).toBe("MDX copy");
    expect(page.body).toContain("MDX body.");
  });
});
