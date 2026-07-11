import type { HTMLAttributes } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/features/factory-ui/data-display";
import inventoryData from "./inventory.json";

type CommandRow = {
  id: string;
  command: string;
  purpose: string;
  runningFactory: string;
};

function loadCommandRows():
  | { state: "success"; rows: CommandRow[] }
  | { state: "empty" }
  | { state: "error" } {
  const commands = inventoryData.commands;
  if (!Array.isArray(commands) || commands.length === 0) {
    return { state: "empty" };
  }

  const rows: CommandRow[] = [];
  for (const entry of commands) {
    if (
      typeof entry?.id !== "string" ||
      typeof entry?.command !== "string" ||
      typeof entry?.purpose !== "string" ||
      typeof entry?.runningFactory !== "string"
    ) {
      return { state: "error" };
    }

    rows.push({
      id: entry.id,
      command: entry.command,
      purpose: entry.purpose,
      runningFactory: entry.runningFactory,
    });
  }

  if (rows.length === 0) {
    return { state: "empty" };
  }

  return { state: "success", rows };
}

function buildColumns(): DataTableColumn<CommandRow>[] {
  return [
    {
      id: "command",
      header: inventoryData.commandColumnHeader,
      cell: (row) => row.command,
    },
    {
      id: "purpose",
      header: inventoryData.purposeColumnHeader,
      cell: (row) => row.purpose,
    },
    {
      id: "runningFactory",
      header: inventoryData.runningFactoryColumnHeader,
      cell: (row) => row.runningFactory,
    },
  ];
}

/**
 * Page-local CLI command reference DataTable for documentation/cli-command-index.
 * Row data stays page-owned via colocated inventory.json.
 */
export function CliCommandIndex() {
  const loaded = loadCommandRows();
  const columns = buildColumns();

  const indexScrollContainerProps = {
    "data-cli-command-index": "",
    "data-testid": "cli-command-index",
  } as HTMLAttributes<HTMLDivElement>;

  if (loaded.state === "error") {
    return (
      <div className="my-6">
        <DataTable
          ariaLabel={inventoryData.ariaLabel}
          columns={columns}
          containerProps={indexScrollContainerProps}
          data={[]}
          errorMessage={inventoryData.errorMessage}
          getRowKey={(row) => row.id}
          state="error"
        />
      </div>
    );
  }

  if (loaded.state === "empty") {
    return (
      <div className="my-6">
        <DataTable
          ariaLabel={inventoryData.ariaLabel}
          columns={columns}
          containerProps={indexScrollContainerProps}
          data={[]}
          emptyMessage={inventoryData.emptyMessage}
          getRowKey={(row) => row.id}
          state="empty"
        />
      </div>
    );
  }

  return (
    <div className="my-6">
      <DataTable
        ariaLabel={inventoryData.ariaLabel}
        columns={columns}
        containerProps={indexScrollContainerProps}
        data={loaded.rows}
        emptyMessage={inventoryData.emptyMessage}
        getRowKey={(row) => row.id}
        state="success"
      />
    </div>
  );
}
