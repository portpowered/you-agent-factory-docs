import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  DELETED_OBSOLETE_ATLAS_WEBSITE_SUITES,
  isWebsiteFunctionalityExcluded,
  listWebsiteFunctionalityExcludedFiles,
  listWebsiteFunctionalityExcludedPrefixes,
  REMOVED_OBSOLETE_EXCLUSION_PREFIXES,
  WEBSITE_FUNCTIONALITY_ATLAS_HTML_ASSERTION_SUFFIXES,
  WEBSITE_FUNCTIONALITY_FILE_EXCLUSIONS,
  WEBSITE_FUNCTIONALITY_PREFIX_EXCLUSIONS,
} from "./website-functionality-exclusions";

const repoRoot = join(import.meta.dir, "../..");

describe("website functionality exclusions", () => {
  test("every prefix exclusion is classified active or replaced with notes", () => {
    expect(WEBSITE_FUNCTIONALITY_PREFIX_EXCLUSIONS.length).toBeGreaterThan(0);
    for (const entry of WEBSITE_FUNCTIONALITY_PREFIX_EXCLUSIONS) {
      expect(["active", "replaced"]).toContain(entry.classification);
      expect(entry.note.length).toBeGreaterThan(0);
      if (entry.classification === "replaced") {
        expect(entry.ownedBy?.length).toBeGreaterThan(0);
      }
    }
  });

  test("every Atlas HTML-assertion suffix exclusion is classified active", () => {
    for (const entry of WEBSITE_FUNCTIONALITY_ATLAS_HTML_ASSERTION_SUFFIXES) {
      expect(entry.classification).toBe("active");
      expect(entry.note.length).toBeGreaterThan(0);
    }
  });

  test("every explicit file exclusion exists and is classified", () => {
    for (const entry of WEBSITE_FUNCTIONALITY_FILE_EXCLUSIONS) {
      expect(existsSync(join(repoRoot, entry.path))).toBe(true);
      expect(["active", "replaced"]).toContain(entry.classification);
      expect(entry.note.length).toBeGreaterThan(0);
      if (entry.classification === "replaced") {
        expect(entry.ownedBy?.length).toBeGreaterThan(0);
      }
    }
  });

  test("obsolete deleted-package and missing-directory prefixes are not kept as skips", () => {
    const prefixes = listWebsiteFunctionalityExcludedPrefixes();
    for (const obsoletePrefix of REMOVED_OBSOLETE_EXCLUSION_PREFIXES) {
      expect(prefixes).not.toContain(obsoletePrefix);
      expect(existsSync(join(repoRoot, obsoletePrefix))).toBe(false);
    }
  });

  test("obsolete Atlas suites are deleted rather than permanently skipped", () => {
    const excludedFiles = listWebsiteFunctionalityExcludedFiles();
    for (const relativePath of DELETED_OBSOLETE_ATLAS_WEBSITE_SUITES) {
      expect(existsSync(join(repoRoot, relativePath))).toBe(false);
      expect(excludedFiles.has(relativePath)).toBe(false);
    }
  });

  test("built-app and built-route Atlas assertion filenames stay excluded", () => {
    expect(
      isWebsiteFunctionalityExcluded(
        "src/tests/layout/grouped-query-attention-built-route-convergence.test.tsx",
      ),
    ).toBe(true);
    expect(
      isWebsiteFunctionalityExcluded(
        "src/tests/content/glossary-decomposition-browse-built-app.test.tsx",
      ),
    ).toBe(true);
  });

  test("replaced build, verify, and reader-facing prefixes document their owning suites", () => {
    const build = WEBSITE_FUNCTIONALITY_PREFIX_EXCLUSIONS.find(
      (entry) => entry.prefix === "src/lib/build/",
    );
    const verify = WEBSITE_FUNCTIONALITY_PREFIX_EXCLUSIONS.find(
      (entry) => entry.prefix === "src/lib/verify/",
    );
    const a11y = WEBSITE_FUNCTIONALITY_PREFIX_EXCLUSIONS.find(
      (entry) => entry.prefix === "src/tests/a11y/",
    );
    const search = WEBSITE_FUNCTIONALITY_PREFIX_EXCLUSIONS.find(
      (entry) => entry.prefix === "src/tests/search/",
    );
    expect(build?.classification).toBe("replaced");
    expect(build?.ownedBy).toContain("test-build-contract");
    expect(verify?.classification).toBe("replaced");
    expect(verify?.ownedBy).toContain("test-verify-contract");
    expect(a11y?.classification).toBe("replaced");
    expect(a11y?.ownedBy).toContain("test-reader-facing");
    expect(search?.classification).toBe("replaced");
    expect(search?.ownedBy).toContain("test-reader-facing");
  });
});
