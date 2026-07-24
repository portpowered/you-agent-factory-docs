/**
 * Page-owned proofs for references/packaged-factories-index/tts.
 * Asserts published nested route, registry alignment, and concise reference
 * chrome (canonical name, description, invocation examples, resource note,
 * parent definition link). Full-mode tts-only replay mount belongs to a later
 * story.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { source } from "@/lib/source";

const PAGE_URL = "/docs/references/packaged-factories-index/tts";
const PAGE_SLUG = "packaged-factories-index/tts";
const REGISTRY_ID = "reference.packaged-factories-index-tts";
const PARENT_DEFINITION_HREF = "/docs/references/packaged-factories-index#tts";
const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("packaged-factories-index tts child reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/references/packaged-factories-index/tts as a concise @you/tts reference",
    async () => {
      const fumadocsPage = source.getPage([
        "references",
        "packaged-factories-index",
        "tts",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe(PAGE_URL);

      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: PAGE_SLUG,
      });

      expect(loadedPage.frontmatter.kind).toBe("reference");
      expect(loadedPage.frontmatter.registryId).toBe(REGISTRY_ID);
      expect(loadedPage.frontmatter.status).toBe("published");
      expect(loadedPage.messages.title).toBe("TTS");
      expect(loadedPage.messages.description).toMatch(/@you\/tts/i);
      expect(loadedPage.messages.sections?.overview?.title).toBe("@you/tts");
      expect(
        String(loadedPage.messages.sections?.overview?.body ?? ""),
      ).toMatch(/converts requested text into speech/i);
      expect(
        String(loadedPage.messages.sections?.resource?.body ?? ""),
      ).toMatch(
        /capacity-1 local omnivoice model resource \(omnivoice-cache \/ ON_DEMAND local backend\)/i,
      );
      expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
      expect(
        loadedPage.messages.sections?.limitsAndAssumptions,
      ).toBeUndefined();
      expect(loadedPage.messages.sections?.related).toBeUndefined();
      expect(loadedPage.messages.sections?.tags).toBeUndefined();
      expect(loadedPage.messages.sections?.references).toBeUndefined();
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.deterministicReplay).toBeUndefined();

      render(
        <main>
          <DocsPageProviders
            assets={loadedPage.assets}
            messages={loadedPage.messages}
          >
            {loadedPage.content}
          </DocsPageProviders>
        </main>,
      );

      expect(screen.getByRole("heading", { name: "@you/tts" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Invocation examples" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Local model resource" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Complete definition" }),
      ).toBeTruthy();
      expect(
        screen.getByText(/converts requested text into speech/i),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /capacity-1 local omnivoice model resource \(omnivoice-cache \/ ON_DEMAND local backend\)/i,
        ),
      ).toBeTruthy();

      expect(
        screen.getByText(
          'you run --named @you/tts "Read this sentence aloud."',
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          'echo "Read this sentence aloud." | you run --named @you/tts',
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(/you run --named @you\/tts <<'EOF'/),
      ).toBeTruthy();
      expect(
        screen.getByText(/Welcome to the release briefing\./),
      ).toBeTruthy();

      const parentLink = screen.getByRole("link", {
        name: "Complete @you/tts definition",
      });
      expect(parentLink.getAttribute("href")).toBe(PARENT_DEFINITION_HREF);

      expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeNull();
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Deterministic replay" }),
      ).toBeNull();
      expect(document.getElementById("related")).toBeNull();
      expect(screen.queryByText(/"name": "@you\/tts"/)).toBeNull();
      expect(screen.queryByText(/builtin-tts/)).toBeNull();
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test("exposes a published multi-segment registry record for the tts child", async () => {
    const indexes = await loadRegistry();
    const record = getRegistryRecord(indexes, REGISTRY_ID);

    expect(record).toBeTruthy();
    expect(record?.kind).toBe("reference");
    expect(record?.id).toBe(REGISTRY_ID);
    expect(record?.slug).toBe(PAGE_SLUG);
    expect(record?.status).toBe("published");
    expect(record?.aliases).toContain("@you/tts");
    expect(record?.relatedIds).toContain("reference.packaged-factories-index");
  });
});
