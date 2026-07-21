import { describe, expect, test } from "bun:test";
import {
  FACTORY_EXPLORER_FOLDER_LABELS,
  FACTORY_EXPLORER_VIRTUAL_FOLDER_LABELS,
  FACTORY_SIDEBAR_FOLDER_LABELS,
} from "@/lib/content/factory-breadcrumb-sidebar";
import {
  DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS,
  SIDEBAR_GROUP_LABELS,
} from "@/lib/content/sidebar-grouping";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  assertExplorerMessages,
  ExplorerLabelsError,
  resolveExplorerMessages,
} from "@/lib/i18n/explorer-labels";
import { supportedLocales } from "@/lib/i18n/locale-routing";

const COMPLETE_ENGLISH_EXPLORER = {
  folders: {
    guides: "Guides",
    concepts: "Concepts",
    techniques: "Techniques",
    documentation: "Program documentation",
    references: "Reference",
    factories: "Factories",
    workers: "Workers",
    workstations: "Workstations",
  },
  conceptsGroups: {
    ...SIDEBAR_GROUP_LABELS.concepts,
  },
  documentationGroups: {
    ...SIDEBAR_GROUP_LABELS.documentation,
  },
  documentationSecondaries: {
    ...DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS,
  },
  referenceGroups: {
    ...SIDEBAR_GROUP_LABELS.references,
  },
  virtualFolders: {
    ...FACTORY_EXPLORER_VIRTUAL_FOLDER_LABELS,
  },
};

describe("explorer labels", () => {
  test("english explorer messages match default-locale sidebar constants", async () => {
    const explorer = resolveExplorerMessages(await loadUiMessages("en"));

    expect(explorer.folders).toEqual({
      guides: FACTORY_EXPLORER_FOLDER_LABELS.guides,
      concepts: FACTORY_EXPLORER_FOLDER_LABELS.concepts,
      techniques: FACTORY_EXPLORER_FOLDER_LABELS.techniques,
      documentation: FACTORY_EXPLORER_FOLDER_LABELS.documentation,
      references: FACTORY_EXPLORER_FOLDER_LABELS.references,
      factories: FACTORY_EXPLORER_FOLDER_LABELS.factories,
      workers: FACTORY_EXPLORER_FOLDER_LABELS.workers,
      workstations: FACTORY_EXPLORER_FOLDER_LABELS.workstations,
    });
    expect(explorer.folders.documentation).toBe(
      FACTORY_SIDEBAR_FOLDER_LABELS.documentation,
    );
    expect(explorer.conceptsGroups).toEqual({
      ...SIDEBAR_GROUP_LABELS.concepts,
    });
    expect(explorer.documentationGroups).toEqual({
      ...SIDEBAR_GROUP_LABELS.documentation,
    });
    expect(explorer.documentationSecondaries).toEqual({
      ...DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS,
    });
    expect(explorer.referenceGroups).toEqual({
      ...SIDEBAR_GROUP_LABELS.references,
    });
    expect(explorer.virtualFolders).toEqual({
      ...FACTORY_EXPLORER_VIRTUAL_FOLDER_LABELS,
    });
    expect(Object.keys(explorer.documentationSecondaries).sort()).toEqual([
      "configuring",
    ]);
    expect(Object.keys(explorer.referenceGroups).sort()).toEqual([
      "contracts",
      "limits",
      "schemas",
    ]);
    expect(Object.keys(explorer.virtualFolders).sort()).toEqual([
      "internal-architecture",
      "miscellanea",
    ]);
    expect(explorer.documentationSecondaries).not.toHaveProperty("resources");
    expect(explorer.documentationSecondaries).not.toHaveProperty(
      "observability",
    );
    expect(explorer.documentationSecondaries).not.toHaveProperty("workers");
    expect(explorer.documentationSecondaries).not.toHaveProperty(
      "workstations",
    );
    expect(explorer.documentationSecondaries).not.toHaveProperty("factories");
    expect(explorer.documentationGroups).not.toHaveProperty(
      "system-feature-set",
    );
    expect(explorer.documentationGroups).not.toHaveProperty(
      "additional-references",
    );
  });

  test("every shipped locale resolves non-empty explorer folder, subgroup, secondary, and virtual folder labels", async () => {
    for (const locale of supportedLocales) {
      const explorer = resolveExplorerMessages(await loadUiMessages(locale));

      for (const label of Object.values(explorer.folders)) {
        expect(label.trim().length).toBeGreaterThan(0);
      }
      for (const label of Object.values(explorer.conceptsGroups)) {
        expect(label.trim().length).toBeGreaterThan(0);
      }
      for (const label of Object.values(explorer.documentationGroups)) {
        expect(label.trim().length).toBeGreaterThan(0);
      }
      for (const label of Object.values(explorer.documentationSecondaries)) {
        expect(label.trim().length).toBeGreaterThan(0);
      }
      for (const label of Object.values(explorer.referenceGroups)) {
        expect(label.trim().length).toBeGreaterThan(0);
      }
      for (const label of Object.values(explorer.virtualFolders)) {
        expect(label.trim().length).toBeGreaterThan(0);
      }

      // Literal CLI/package/route identifiers stay untranslated in page titles;
      // Program documentation top-group labels localize (Interfaces is not a
      // literal API/CLI/MCP separator after the three-level IA).
      expect(
        explorer.documentationGroups.interfaces.trim().length,
      ).toBeGreaterThan(0);
      expect(
        explorer.documentationGroups.orientation.trim().length,
      ).toBeGreaterThan(0);
      expect(
        explorer.documentationGroups.capabilities.trim().length,
      ).toBeGreaterThan(0);
      expect(
        explorer.documentationGroups.operations.trim().length,
      ).toBeGreaterThan(0);
      expect(
        explorer.documentationSecondaries.configuring.trim().length,
      ).toBeGreaterThan(0);
      expect(
        explorer.virtualFolders["internal-architecture"].trim().length,
      ).toBeGreaterThan(0);
      expect(explorer.virtualFolders.miscellanea.trim().length).toBeGreaterThan(
        0,
      );
    }
  });

  test("non-english explorer folder labels differ from english defaults", async () => {
    const en = resolveExplorerMessages(await loadUiMessages("en"));
    const ja = resolveExplorerMessages(await loadUiMessages("ja"));
    const vi = resolveExplorerMessages(await loadUiMessages("vi"));
    const zhCN = resolveExplorerMessages(await loadUiMessages("zh-CN"));

    expect(ja.folders.concepts).not.toBe(en.folders.concepts);
    expect(ja.folders.documentation).not.toBe(en.folders.documentation);
    expect(ja.conceptsGroups.harnesses).not.toBe(en.conceptsGroups.harnesses);
    expect(ja.documentationSecondaries.configuring).not.toBe(
      en.documentationSecondaries.configuring,
    );
    expect(ja.documentationGroups.orientation).not.toBe(
      en.documentationGroups.orientation,
    );
    expect(ja.virtualFolders.miscellanea).not.toBe(
      en.virtualFolders.miscellanea,
    );
    expect(ja.virtualFolders["internal-architecture"]).not.toBe(
      en.virtualFolders["internal-architecture"],
    );

    expect(vi.folders.guides).not.toBe(en.folders.guides);
    expect(vi.documentationGroups.capabilities).not.toBe(
      en.documentationGroups.capabilities,
    );
    expect(vi.documentationSecondaries.configuring).not.toBe(
      en.documentationSecondaries.configuring,
    );
    expect(vi.virtualFolders.miscellanea).not.toBe(
      en.virtualFolders.miscellanea,
    );

    expect(zhCN.folders.techniques).not.toBe(en.folders.techniques);
    expect(zhCN.conceptsGroups["model-inference"]).not.toBe(
      en.conceptsGroups["model-inference"],
    );
    expect(zhCN.documentationSecondaries.configuring).not.toBe(
      en.documentationSecondaries.configuring,
    );
    expect(zhCN.virtualFolders["internal-architecture"]).not.toBe(
      en.virtualFolders["internal-architecture"],
    );
  });

  test("assertExplorerMessages fails closed for missing explorer catalogs", () => {
    expect(() => assertExplorerMessages(undefined)).toThrow(
      ExplorerLabelsError,
    );
    expect(() => assertExplorerMessages({})).toThrow(ExplorerLabelsError);
    expect(() =>
      assertExplorerMessages({
        ...COMPLETE_ENGLISH_EXPLORER,
        conceptsGroups: {
          harnesses: "Harnesses",
          "industrial-engineering": "",
          "model-inference": "Model inference",
        },
      }),
    ).toThrow(/industrial-engineering/);
  });

  test("assertExplorerMessages fails closed for missing documentation secondary catalogs", () => {
    expect(() =>
      assertExplorerMessages({
        ...COMPLETE_ENGLISH_EXPLORER,
        documentationSecondaries: {
          ...DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS,
          configuring: "   ",
        },
      }),
    ).toThrow(/documentationSecondaries\.configuring/);
  });

  test("assertExplorerMessages fails closed for missing virtual folder catalogs", () => {
    expect(() =>
      assertExplorerMessages({
        ...COMPLETE_ENGLISH_EXPLORER,
        virtualFolders: {
          ...FACTORY_EXPLORER_VIRTUAL_FOLDER_LABELS,
          miscellanea: "",
        },
      }),
    ).toThrow(/virtualFolders\.miscellanea/);
    expect(() =>
      assertExplorerMessages({
        folders: COMPLETE_ENGLISH_EXPLORER.folders,
        conceptsGroups: COMPLETE_ENGLISH_EXPLORER.conceptsGroups,
        documentationGroups: COMPLETE_ENGLISH_EXPLORER.documentationGroups,
        documentationSecondaries:
          COMPLETE_ENGLISH_EXPLORER.documentationSecondaries,
        referenceGroups: COMPLETE_ENGLISH_EXPLORER.referenceGroups,
      }),
    ).toThrow(/virtual folder/);
  });
});
