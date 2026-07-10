import { describe, expect, test } from "bun:test";
import type { TableRecord } from "@/lib/content/schemas";
import { collectTableMessageKeys } from "@/lib/content/table-message-keys";

describe("collectTableMessageKeys", () => {
  test("collects dimension, column title, and cell value keys", () => {
    const table: TableRecord = {
      id: "table.example",
      subjectId: "module.example",
      dimensions: [
        { id: "dim-a", labelKey: "table.dimA" },
        { id: "dim-b", labelKey: "table.dimB" },
      ],
      columns: [
        { moduleId: "module.a", titleKey: "table.colA" },
        { moduleId: "module.b" },
      ],
      valueKeysByModuleId: {
        "module.a": { "dim-a": "table.a.dimA", "dim-b": "table.a.dimB" },
        "module.b": { "dim-a": "table.b.dimA" },
      },
    };

    expect(collectTableMessageKeys(table).sort()).toEqual(
      [
        "table.a.dimA",
        "table.a.dimB",
        "table.b.dimA",
        "table.colA",
        "table.dimA",
        "table.dimB",
      ].sort(),
    );
  });
});
