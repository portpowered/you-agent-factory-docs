/**
 * Story 001 — three-level Program documentation taxonomy contract.
 * Locks top-group order, secondary declarations, and slug membership.
 */
import { describe, expect, test } from "bun:test";
import { isDocsExplorerTopLevelFaqPage } from "@/lib/content/factory-breadcrumb-sidebar";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import {
  DEFERRED_DOCUMENTATION_EXPLORER_MEMBERSHIP_SLUGS,
  DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS,
  DOCUMENTATION_SIDEBAR_SECONDARY_LABELS,
  documentationSidebarMembershipSlug,
  FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG,
  FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG,
  getDocumentationSidebarMembership,
  getDocumentationSidebarSecondaryIdsForGroup,
  getDocumentationSidebarSecondaryLabel,
  hasDocumentationSidebarMembership,
  isDeferredDocumentationExplorerMembershipSlug,
  isDocumentationSidebarSecondaryGroup,
  MODE_A_PROGRAM_OVERVIEW_PENDING_EXPLORER_MEMBERSHIP_SLUGS,
  PROGRAM_DOCUMENTATION_DEMOTED_SLUGS,
  SIDEBAR_GROUP_LABELS,
} from "@/lib/content/sidebar-grouping";

const DECLARED_TOP_GROUP_ORDER = [
  "orientation",
  "capabilities",
  "interfaces",
  "operations",
] as const;

const DECLARED_TOP_GROUP_LABELS = [
  "Orientation",
  "Capabilities",
  "Interfaces",
  "Operations",
] as const;

const EXPECTED_MEMBERSHIP = {
  "what-is-you-agent-factory": { group: "orientation" },
  "harness-support": { group: "capabilities" },
  "submitting-work": { group: "capabilities" },
  "replays-records": { group: "capabilities" },
  "packaged-documents": { group: "capabilities" },
  "factory-session": { group: "capabilities" },
  "dynamic-workflows": { group: "capabilities" },
  "packaged-factories": { group: "capabilities" },
  cli: { group: "interfaces" },
  mcp: { group: "interfaces" },
  api: { group: "interfaces" },
  logs: { group: "operations" },
  metrics: { group: "operations" },
  "dashboard-ui-overview": { group: "operations" },
  resources: { group: "operations", secondary: "configuring" },
  "factories/configuration": {
    group: "operations",
    secondary: "configuring",
  },
  "factories/global-configuration": {
    group: "operations",
    secondary: "configuring",
  },
} as const;

/** Former Program taxonomy ids that must not remain in the locked map. */
const RETIRED_PROGRAM_TOP_GROUP_IDS = [
  "system-feature-set",
  "packaged-factories",
  "factory-configuration",
  "system-operations",
  "internal-architecture",
  "additional-references",
] as const;

/** W18 ledger move-stub slugs — published for compatibility, not explorer members. */
const W18_DOCUMENTATION_MOVE_STUB_SLUGS = [
  "api-doc",
  "cli-command-index",
  "configuration",
  "global-configuration-factories",
  "workers",
  "agent-workers",
  "inference-workers",
  "script-workers",
  "poller-workers",
  "mock-workers",
  "workstations",
] as const;

/** Membership keys that are factories collection docsSlugs, not documentation/*. */
const FACTORIES_CONFIG_MEMBERSHIP_SLUGS = [
  "factories/configuration",
  "factories/global-configuration",
] as const;

describe("Program documentation three-level taxonomy", () => {
  test("declares four top groups in stable order with default-locale labels", () => {
    expect(Object.keys(SIDEBAR_GROUP_LABELS.documentation)).toEqual([
      ...DECLARED_TOP_GROUP_ORDER,
    ]);
    expect(Object.values(SIDEBAR_GROUP_LABELS.documentation)).toEqual([
      ...DECLARED_TOP_GROUP_LABELS,
    ]);
    for (const retiredId of RETIRED_PROGRAM_TOP_GROUP_IDS) {
      expect(SIDEBAR_GROUP_LABELS.documentation).not.toHaveProperty(retiredId);
    }
  });

  test("Operations declares Configuring secondary; former secondaries are retired", () => {
    expect(getDocumentationSidebarSecondaryIdsForGroup("operations")).toEqual([
      "configuring",
    ]);
    expect(
      getDocumentationSidebarSecondaryLabel("operations", "configuring"),
    ).toBe("Configuring you-agent-factory");

    expect(Object.keys(DOCUMENTATION_SIDEBAR_SECONDARY_LABELS)).toEqual([
      "operations",
    ]);
    expect(DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS).toEqual({
      configuring: "Configuring you-agent-factory",
    });
    expect(DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS).not.toHaveProperty(
      "resources",
    );
    expect(DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS).not.toHaveProperty(
      "observability",
    );
    expect(DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS).not.toHaveProperty(
      "workers",
    );
    expect(DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS).not.toHaveProperty(
      "workstations",
    );
    expect(DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS).not.toHaveProperty(
      "factories",
    );
    expect(isDocumentationSidebarSecondaryGroup("orientation")).toBe(false);
    expect(isDocumentationSidebarSecondaryGroup("capabilities")).toBe(false);
    expect(isDocumentationSidebarSecondaryGroup("interfaces")).toBe(false);
    expect(isDocumentationSidebarSecondaryGroup("operations")).toBe(true);
  });

  test("membership slug helper strips documentation prefix and keeps factories docsSlugs", () => {
    expect(documentationSidebarMembershipSlug("documentation/resources")).toBe(
      "resources",
    );
    expect(documentationSidebarMembershipSlug("factories/configuration")).toBe(
      "factories/configuration",
    );
    expect(hasDocumentationSidebarMembership("documentation/resources")).toBe(
      true,
    );
    expect(hasDocumentationSidebarMembership("factories/configuration")).toBe(
      true,
    );
    expect(
      hasDocumentationSidebarMembership("factories/global-configuration"),
    ).toBe(true);
    expect(hasDocumentationSidebarMembership("factories/sessions")).toBe(false);
    expect(hasDocumentationSidebarMembership("documentation/install")).toBe(
      false,
    );
  });

  test("default membership matches the locked Orientation / Capabilities / Interfaces / Operations IA", () => {
    expect(FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG).toEqual(
      EXPECTED_MEMBERSHIP,
    );

    for (const [slug, membership] of Object.entries(
      EXPECTED_MEMBERSHIP,
    ) as Array<
      [
        keyof typeof EXPECTED_MEMBERSHIP,
        (typeof EXPECTED_MEMBERSHIP)[keyof typeof EXPECTED_MEMBERSHIP],
      ]
    >) {
      expect(getDocumentationSidebarMembership(slug)).toEqual(membership);
      expect(FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG[slug]).toBe(
        membership.group,
      );
    }
  });

  test("Program membership omits FAQ, W18 stubs, locked PS-100 demotions, and deferred pages", () => {
    const publishedSlugs = loadPublishedDocsPagesSync("en")
      .filter((page) => page.docsSlug.startsWith("documentation/"))
      .map((page) => page.docsSlug.slice("documentation/".length));

    const membershipSlugs = Object.keys(
      FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG,
    );
    const moveStubSlugSet = new Set<string>(W18_DOCUMENTATION_MOVE_STUB_SLUGS);
    const demotedSlugSet = new Set<string>(PROGRAM_DOCUMENTATION_DEMOTED_SLUGS);

    expect(membershipSlugs).not.toContain("faq");
    expect(getDocumentationSidebarMembership("faq")).toBeUndefined();
    expect(
      FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG[
        "faq" as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG
      ],
    ).toBeUndefined();

    for (const demoted of PROGRAM_DOCUMENTATION_DEMOTED_SLUGS) {
      expect(membershipSlugs).not.toContain(demoted);
      expect(getDocumentationSidebarMembership(demoted)).toBeUndefined();
    }

    for (const stubSlug of W18_DOCUMENTATION_MOVE_STUB_SLUGS) {
      expect(membershipSlugs).not.toContain(stubSlug);
      expect(getDocumentationSidebarMembership(stubSlug)).toBeUndefined();
      expect(publishedSlugs).toContain(stubSlug);
    }

    for (const overviewSlug of [
      "factory-session",
      "dynamic-workflows",
      "packaged-factories",
    ] as const) {
      expect(membershipSlugs).toContain(overviewSlug);
      expect(getDocumentationSidebarMembership(overviewSlug)).toEqual({
        group: "capabilities",
      });
      expect(publishedSlugs).toContain(overviewSlug);
      expect(moveStubSlugSet.has(overviewSlug)).toBe(false);
      expect(
        MODE_A_PROGRAM_OVERVIEW_PENDING_EXPLORER_MEMBERSHIP_SLUGS,
      ).not.toContain(overviewSlug);
    }

    expect(membershipSlugs).toContain("api");
    expect(getDocumentationSidebarMembership("api")).toEqual({
      group: "interfaces",
    });
    expect(publishedSlugs).toContain("api");
    expect(moveStubSlugSet.has("api")).toBe(false);
    expect(DEFERRED_DOCUMENTATION_EXPLORER_MEMBERSHIP_SLUGS).not.toContain(
      "api",
    );
    expect(isDeferredDocumentationExplorerMembershipSlug("api")).toBe(false);

    for (const deferredSlug of DEFERRED_DOCUMENTATION_EXPLORER_MEMBERSHIP_SLUGS) {
      expect(membershipSlugs).not.toContain(deferredSlug);
      expect(getDocumentationSidebarMembership(deferredSlug)).toBeUndefined();
      expect(isDeferredDocumentationExplorerMembershipSlug(deferredSlug)).toBe(
        true,
      );
      expect(publishedSlugs).toContain(deferredSlug);
    }

    expect([...demotedSlugSet].sort()).toEqual(
      [...PROGRAM_DOCUMENTATION_DEMOTED_SLUGS].sort(),
    );
  });

  test("every published documentation page is FAQ, W18 stub, demotion, Mode A pending, deferred, or exactly one membership path", () => {
    const publishedDocumentationSlugs = loadPublishedDocsPagesSync("en")
      .filter((page) => page.docsSlug.startsWith("documentation/"))
      .map((page) => page.docsSlug.slice("documentation/".length));

    const publishedDocsSlugs = new Set(
      loadPublishedDocsPagesSync("en").map((page) => page.docsSlug),
    );

    const membershipSlugs = Object.keys(
      FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG,
    );
    const moveStubSlugSet = new Set<string>(W18_DOCUMENTATION_MOVE_STUB_SLUGS);
    const demotedSlugSet = new Set<string>(PROGRAM_DOCUMENTATION_DEMOTED_SLUGS);
    const pendingExplorerSlugSet = new Set<string>(
      MODE_A_PROGRAM_OVERVIEW_PENDING_EXPLORER_MEMBERSHIP_SLUGS,
    );

    for (const stubSlug of W18_DOCUMENTATION_MOVE_STUB_SLUGS) {
      expect(publishedDocumentationSlugs).toContain(stubSlug);
    }

    for (const demoted of PROGRAM_DOCUMENTATION_DEMOTED_SLUGS) {
      expect(publishedDocumentationSlugs).toContain(demoted);
    }

    for (const factoriesSlug of FACTORIES_CONFIG_MEMBERSHIP_SLUGS) {
      expect(publishedDocsSlugs.has(factoriesSlug)).toBe(true);
      expect(publishedDocumentationSlugs).not.toContain(factoriesSlug);
    }

    for (const slug of publishedDocumentationSlugs) {
      if (isDocsExplorerTopLevelFaqPage(`documentation/${slug}`)) {
        expect(getDocumentationSidebarMembership(slug)).toBeUndefined();
        continue;
      }
      if (
        moveStubSlugSet.has(slug) ||
        demotedSlugSet.has(slug) ||
        pendingExplorerSlugSet.has(slug)
      ) {
        expect(getDocumentationSidebarMembership(slug)).toBeUndefined();
        continue;
      }
      if (isDeferredDocumentationExplorerMembershipSlug(slug)) {
        expect(getDocumentationSidebarMembership(slug)).toBeUndefined();
        continue;
      }

      const membership = getDocumentationSidebarMembership(slug);
      expect(
        membership,
        `${slug} must be assigned to exactly one Program documentation path`,
      ).toBeDefined();
      if (!membership) {
        continue;
      }

      expect(Object.keys(SIDEBAR_GROUP_LABELS.documentation)).toContain(
        membership.group,
      );

      if ("secondary" in membership) {
        expect(
          isDocumentationSidebarSecondaryGroup(membership.group),
          `${slug} secondary requires a group that declares secondaries`,
        ).toBe(true);
        if (!isDocumentationSidebarSecondaryGroup(membership.group)) {
          continue;
        }
        const secondaryIds = getDocumentationSidebarSecondaryIdsForGroup(
          membership.group,
        ) as readonly string[];
        expect(secondaryIds).toContain(membership.secondary);
      }
    }

    for (const slug of membershipSlugs) {
      if (
        (FACTORIES_CONFIG_MEMBERSHIP_SLUGS as readonly string[]).includes(slug)
      ) {
        expect(publishedDocsSlugs.has(slug)).toBe(true);
        continue;
      }
      expect(publishedDocumentationSlugs).toContain(slug);
    }
  });
});
