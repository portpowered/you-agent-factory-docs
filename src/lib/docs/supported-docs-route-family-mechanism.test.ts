import { describe, expect, test } from "bun:test";
import {
  isDirectDocsRouteFamilyCatchAllSlug,
  isDirectDocsRouteFamilyId,
  isDirectDocsRouteFamilySlug,
} from "@/lib/content/docs-catch-all-static-params";
import { parseLocalDocsPageRef } from "@/lib/content/local-docs-page";
import { DIRECT_DOCS_ROUTE_FAMILY_IDS } from "@/lib/docs/collection-definition-contract";
import {
  CLI_DOCS_COLLECTION_IDS,
  docsSlugBelongsToCliCollection,
  docsSlugBelongsToCollection,
  isAcceptedDocsSourceSection,
  resolveDocsCollectionIdFromDocsSlug,
} from "@/lib/docs/docs-collection-slug-acceptance";
import { isDocsCollectionId } from "@/lib/docs/section-collection-index";

/**
 * Focused mechanism tests for the supported docs route-family contract.
 * Asserts observable accept / reject / resolve outcomes from collection and
 * routing helpers — not source-file inventories or registration list scans.
 */
describe("supported docs route-family mechanism", () => {
  test("accepts references, factories, workers, and workstations as supported route families", () => {
    for (const familyId of DIRECT_DOCS_ROUTE_FAMILY_IDS) {
      expect(isDocsCollectionId(familyId)).toBe(true);
      expect(isAcceptedDocsSourceSection(familyId)).toBe(true);
      expect(isDirectDocsRouteFamilyId(familyId)).toBe(true);
      expect(isDirectDocsRouteFamilySlug(familyId)).toBe(true);
      expect(isDirectDocsRouteFamilySlug(`${familyId}/child`)).toBe(true);
    }

    expect(resolveDocsCollectionIdFromDocsSlug("references/api")).toBe(
      "references",
    );
    expect(resolveDocsCollectionIdFromDocsSlug("factories/packaged")).toBe(
      "factories",
    );
    expect(resolveDocsCollectionIdFromDocsSlug("workers/agent")).toBe(
      "workers",
    );
    expect(
      resolveDocsCollectionIdFromDocsSlug("workstations/inference-run"),
    ).toBe("workstations");

    expect(docsSlugBelongsToCollection("references/api", "references")).toBe(
      true,
    );
    expect(docsSlugBelongsToCollection("factories/packaged", "factories")).toBe(
      true,
    );
    expect(docsSlugBelongsToCollection("workers/agent", "workers")).toBe(true);
    expect(
      docsSlugBelongsToCollection("workstations/inference-run", "workstations"),
    ).toBe(true);
  });

  test("rejects unknown route-family ids through collection and route helpers", () => {
    for (const unknownId of [
      "modules",
      "models",
      "papers",
      "training",
      "systems",
      "unknown-family",
      "blog",
    ] as const) {
      expect(isDocsCollectionId(unknownId)).toBe(false);
      expect(isAcceptedDocsSourceSection(unknownId)).toBe(false);
      expect(isDirectDocsRouteFamilyId(unknownId)).toBe(false);
      expect(isDirectDocsRouteFamilySlug(unknownId)).toBe(false);
      expect(isDirectDocsRouteFamilySlug(`${unknownId}/page`)).toBe(false);
      expect(isDirectDocsRouteFamilyCatchAllSlug([unknownId, "page"])).toBe(
        false,
      );
      expect(
        resolveDocsCollectionIdFromDocsSlug(`${unknownId}/page`),
      ).toBeNull();
      expect(parseLocalDocsPageRef([unknownId, "page"])).toBeNull();
    }
  });

  test("accepts nested slugs under the new families and preserves CLI collection acceptance", () => {
    expect(parseLocalDocsPageRef(["references", "openapi", "paths"])).toEqual({
      section: "references",
      slug: "openapi/paths",
    });
    expect(
      parseLocalDocsPageRef(["factories", "docs", "write-review"]),
    ).toEqual({
      section: "factories",
      slug: "docs/write-review",
    });
    expect(parseLocalDocsPageRef(["workers", "agent", "variant"])).toEqual({
      section: "workers",
      slug: "agent/variant",
    });
    expect(parseLocalDocsPageRef(["workstations", "inference", "run"])).toEqual(
      {
        section: "workstations",
        slug: "inference/run",
      },
    );

    expect(resolveDocsCollectionIdFromDocsSlug("workers/agent/variant")).toBe(
      "workers",
    );
    expect(
      resolveDocsCollectionIdFromDocsSlug("references/openapi/paths"),
    ).toBe("references");
    expect(
      isDirectDocsRouteFamilyCatchAllSlug(["workers", "agent", "variant"]),
    ).toBe(true);
    expect(
      isDirectDocsRouteFamilyCatchAllSlug(["workstations", "inference", "run"]),
    ).toBe(true);

    // One-segment indexes are not nested page refs.
    expect(parseLocalDocsPageRef(["workers"])).toBeNull();
    expect(parseLocalDocsPageRef(["references"])).toBeNull();

    for (const collectionId of CLI_DOCS_COLLECTION_IDS) {
      expect(isAcceptedDocsSourceSection(collectionId)).toBe(true);
      expect(isDocsCollectionId(collectionId)).toBe(true);
    }

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

    expect(parseLocalDocsPageRef(["guides", "getting-started"])).toEqual({
      section: "guides",
      slug: "getting-started",
    });
    expect(parseLocalDocsPageRef(["concepts", "harness", "nested"])).toEqual({
      section: "concepts",
      slug: "harness/nested",
    });
    expect(resolveDocsCollectionIdFromDocsSlug("guides/getting-started")).toBe(
      "guides",
    );
    expect(
      resolveDocsCollectionIdFromDocsSlug("documentation/cli-reference"),
    ).toBe("documentation");
  });
});
