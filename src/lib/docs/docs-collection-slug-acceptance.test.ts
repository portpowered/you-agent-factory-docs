import { describe, expect, test } from "bun:test";
import {
  CLI_DOCS_COLLECTION_IDS,
  docsSlugBelongsToCliCollection,
  docsSlugBelongsToCollection,
  isAcceptedDocsSourceSection,
  resolveDocsCollectionIdFromDocsSlug,
} from "@/lib/docs/docs-collection-slug-acceptance";

describe("docs collection slug acceptance", () => {
  test("accepts CLI route prefixes as belonging to the matching CLI collection", () => {
    expect(
      docsSlugBelongsToCliCollection("guides/getting-started", "guides"),
    ).toBe(true);
    expect(
      docsSlugBelongsToCliCollection("concepts/attention-overview", "concepts"),
    ).toBe(true);
    expect(
      docsSlugBelongsToCliCollection("techniques/prompt-caching", "techniques"),
    ).toBe(true);
    expect(
      docsSlugBelongsToCliCollection(
        "documentation/cli-reference",
        "documentation",
      ),
    ).toBe(true);
  });

  test("resolves each CLI prefix to the matching collection id", () => {
    expect(resolveDocsCollectionIdFromDocsSlug("guides/getting-started")).toBe(
      "guides",
    );
    expect(
      resolveDocsCollectionIdFromDocsSlug("concepts/attention-overview"),
    ).toBe("concepts");
    expect(
      resolveDocsCollectionIdFromDocsSlug("techniques/prompt-caching"),
    ).toBe("techniques");
    expect(
      resolveDocsCollectionIdFromDocsSlug("documentation/cli-reference"),
    ).toBe("documentation");
  });

  test("does not accept non-CLI prefixes as CLI collections", () => {
    for (const collectionId of CLI_DOCS_COLLECTION_IDS) {
      expect(
        docsSlugBelongsToCliCollection("modules/attention", collectionId),
      ).toBe(false);
      expect(docsSlugBelongsToCliCollection("models/gpt-2", collectionId)).toBe(
        false,
      );
      expect(
        docsSlugBelongsToCliCollection(
          "papers/attention-is-all-you-need",
          collectionId,
        ),
      ).toBe(false);
      expect(
        docsSlugBelongsToCliCollection("training/pretraining", collectionId),
      ).toBe(false);
      expect(
        docsSlugBelongsToCliCollection("systems/batching", collectionId),
      ).toBe(false);
      expect(
        docsSlugBelongsToCliCollection("glossary/token", collectionId),
      ).toBe(false);
    }

    expect(resolveDocsCollectionIdFromDocsSlug("modules/attention")).toBe(
      "modules",
    );
    expect(docsSlugBelongsToCollection("modules/attention", "modules")).toBe(
      true,
    );
  });

  test("rejects bare section names and unknown prefixes", () => {
    expect(resolveDocsCollectionIdFromDocsSlug("guides")).toBeNull();
    expect(resolveDocsCollectionIdFromDocsSlug("unknown/page")).toBeNull();
    expect(isAcceptedDocsSourceSection("guides")).toBe(true);
    expect(isAcceptedDocsSourceSection("techniques")).toBe(true);
    expect(isAcceptedDocsSourceSection("documentation")).toBe(true);
    expect(isAcceptedDocsSourceSection("concepts")).toBe(true);
    expect(isAcceptedDocsSourceSection("unknown")).toBe(false);
  });
});
