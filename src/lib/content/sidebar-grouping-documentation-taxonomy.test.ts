/**
 * Story 001 — three-level Program documentation taxonomy contract.
 * Locks top-group order, secondary declarations, and slug membership.
 */
import { describe, expect, test } from "bun:test";
import { isDocsExplorerTopLevelFaqPage } from "@/lib/content/factory-breadcrumb-sidebar";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import {
  DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS,
  DOCUMENTATION_SIDEBAR_SECONDARY_LABELS,
  FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG,
  FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG,
  getDocumentationSidebarMembership,
  getDocumentationSidebarSecondaryIdsForGroup,
  getDocumentationSidebarSecondaryLabel,
  isDocumentationSidebarSecondaryGroup,
  SIDEBAR_GROUP_LABELS,
} from "@/lib/content/sidebar-grouping";

const DECLARED_TOP_GROUP_ORDER = [
  "system-feature-set",
  "interfaces",
  "packaged-factories",
  "factory-configuration",
  "system-operations",
  "internal-architecture",
  "additional-references",
] as const;

const DECLARED_TOP_GROUP_LABELS = [
  "System feature set",
  "Interfaces",
  "Packaged factories",
  "Factory Configuration",
  "System Operations",
  "Internal Architecture",
  "Additional references",
] as const;

const EXPECTED_MEMBERSHIP = {
  "harness-support": { group: "system-feature-set" },
  "replays-records": { group: "system-feature-set" },
  "submitting-work": { group: "system-feature-set" },
  cli: { group: "interfaces" },
  mcp: { group: "interfaces" },
  "packaged-documents": { group: "packaged-factories" },
  resources: { group: "factory-configuration", secondary: "resources" },
  "throttling-and-limits": {
    group: "factory-configuration",
    secondary: "resources",
  },
  logs: { group: "system-operations", secondary: "observability" },
  metrics: { group: "system-operations", secondary: "observability" },
  "architecture-of-system": { group: "internal-architecture" },
  petri: { group: "internal-architecture" },
  "what-is-you-agent-factory": { group: "additional-references" },
  install: { group: "additional-references" },
  "contributing-to-these-docs": { group: "additional-references" },
  "dashboard-ui-overview": { group: "additional-references" },
  "security-trust-boundaries": { group: "additional-references" },
  troubleshooting: { group: "additional-references" },
} as const;

/** W18 ledger move-stub slugs — published for compatibility, not explorer members. */
const W18_DOCUMENTATION_MOVE_STUB_SLUGS = [
  "api-doc",
  "cli-command-index",
  "configuration",
  "global-configuration-factories",
  "packaged-factories",
  "dynamic-workflows",
  "factory-session",
  "workers",
  "agent-workers",
  "inference-workers",
  "script-workers",
  "poller-workers",
  "mock-workers",
  "workstations",
] as const;

describe("Program documentation three-level taxonomy", () => {
  test("declares seven top groups in stable order with default-locale labels", () => {
    expect(Object.keys(SIDEBAR_GROUP_LABELS.documentation)).toEqual([
      ...DECLARED_TOP_GROUP_ORDER,
    ]);
    expect(Object.values(SIDEBAR_GROUP_LABELS.documentation)).toEqual([
      ...DECLARED_TOP_GROUP_LABELS,
    ]);
  });

  test("Factory Configuration and System Operations declare required secondaries", () => {
    expect(
      getDocumentationSidebarSecondaryIdsForGroup("factory-configuration"),
    ).toEqual(["workers", "workstations", "factories", "resources"]);
    expect(
      getDocumentationSidebarSecondaryLabel("factory-configuration", "workers"),
    ).toBe("Workers");
    expect(
      getDocumentationSidebarSecondaryLabel(
        "factory-configuration",
        "workstations",
      ),
    ).toBe("Workstations");
    expect(
      getDocumentationSidebarSecondaryLabel(
        "factory-configuration",
        "factories",
      ),
    ).toBe("Factories");
    expect(
      getDocumentationSidebarSecondaryLabel(
        "factory-configuration",
        "resources",
      ),
    ).toBe("Resources");

    expect(
      getDocumentationSidebarSecondaryIdsForGroup("system-operations"),
    ).toEqual(["observability"]);
    expect(
      getDocumentationSidebarSecondaryLabel(
        "system-operations",
        "observability",
      ),
    ).toBe("Observability");

    expect(Object.keys(DOCUMENTATION_SIDEBAR_SECONDARY_LABELS)).toEqual([
      "factory-configuration",
      "system-operations",
    ]);
    expect(DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS).toEqual({
      workers: "Workers",
      workstations: "Workstations",
      factories: "Factories",
      resources: "Resources",
      observability: "Observability",
    });
    expect(isDocumentationSidebarSecondaryGroup("system-feature-set")).toBe(
      false,
    );
    expect(isDocumentationSidebarSecondaryGroup("factory-configuration")).toBe(
      true,
    );
  });

  test("default membership matches the declared three-level IA map", () => {
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

  test("every published documentation page except FAQ and W18 move stubs has exactly one membership path", () => {
    const publishedSlugs = loadPublishedDocsPagesSync("en")
      .filter((page) => page.docsSlug.startsWith("documentation/"))
      .map((page) => page.docsSlug.slice("documentation/".length));

    const membershipSlugs = Object.keys(
      FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG,
    );
    const moveStubSlugSet = new Set<string>(W18_DOCUMENTATION_MOVE_STUB_SLUGS);

    expect(membershipSlugs).not.toContain("faq");
    expect(getDocumentationSidebarMembership("faq")).toBeUndefined();
    expect(
      FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG[
        "faq" as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG
      ],
    ).toBeUndefined();

    for (const stubSlug of W18_DOCUMENTATION_MOVE_STUB_SLUGS) {
      expect(membershipSlugs).not.toContain(stubSlug);
      expect(getDocumentationSidebarMembership(stubSlug)).toBeUndefined();
      expect(publishedSlugs).toContain(stubSlug);
    }

    for (const slug of publishedSlugs) {
      if (isDocsExplorerTopLevelFaqPage(`documentation/${slug}`)) {
        expect(getDocumentationSidebarMembership(slug)).toBeUndefined();
        continue;
      }
      if (moveStubSlugSet.has(slug)) {
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

      if (isDocumentationSidebarSecondaryGroup(membership.group)) {
        expect(
          "secondary" in membership,
          `${slug} under ${membership.group} must declare a secondary`,
        ).toBe(true);
        if (!("secondary" in membership)) {
          continue;
        }
        const secondaryIds = getDocumentationSidebarSecondaryIdsForGroup(
          membership.group,
        ) as readonly string[];
        expect(secondaryIds).toContain(membership.secondary);
      } else {
        expect(
          "secondary" in membership,
          `${slug} under ${membership.group} must not declare a secondary`,
        ).toBe(false);
      }
    }

    for (const slug of membershipSlugs) {
      expect(publishedSlugs).toContain(slug);
    }
  });
});
