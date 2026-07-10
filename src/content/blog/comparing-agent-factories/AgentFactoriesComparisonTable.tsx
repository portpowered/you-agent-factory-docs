/**
 * Post-local comparison matrix for /blog/comparing-agent-factories.
 * Fixture rows stay post-owned; DataTable comes from factory-ui wrappers.
 */
import {
  DataTable,
  type DataTableColumn,
} from "@/features/factory-ui/data-display";

export type AgentFactoryComparisonRow = {
  id: string;
  system: string;
  recursionFanInStateful: string;
  customWorkflows: string;
  agentHarnessSupport: string;
  fileFirst: string;
  durableWorkflows: string;
  relativelyStable: string;
};

const YES = "Yes";
const NO = "—";

/** Systems × dimensions rewritten for the web from the CLI comparative note. */
export const agentFactoryComparisonRows: AgentFactoryComparisonRow[] = [
  {
    id: "you-agent-factory",
    system: "you-agent-factory",
    recursionFanInStateful: YES,
    customWorkflows: YES,
    agentHarnessSupport: YES,
    fileFirst: YES,
    durableWorkflows: NO,
    relativelyStable: YES,
  },
  {
    id: "custom-scripts",
    system: "Custom scripts",
    recursionFanInStateful: YES,
    customWorkflows: YES,
    agentHarnessSupport: YES,
    fileFirst: YES,
    durableWorkflows: NO,
    relativelyStable: NO,
  },
  {
    id: "gas-town",
    system: "Gas Town",
    recursionFanInStateful: YES,
    customWorkflows: NO,
    agentHarnessSupport: YES,
    fileFirst: NO,
    durableWorkflows: NO,
    relativelyStable: YES,
  },
  {
    id: "dbos",
    system: "DBOS",
    recursionFanInStateful: YES,
    customWorkflows: YES,
    agentHarnessSupport: NO,
    fileFirst: NO,
    durableWorkflows: YES,
    relativelyStable: YES,
  },
  {
    id: "dagster",
    system: "Dagster",
    recursionFanInStateful: NO,
    customWorkflows: YES,
    agentHarnessSupport: NO,
    fileFirst: NO,
    durableWorkflows: NO,
    relativelyStable: YES,
  },
  {
    id: "n8n",
    system: "N8N",
    recursionFanInStateful: YES,
    customWorkflows: YES,
    agentHarnessSupport: NO,
    fileFirst: NO,
    durableWorkflows: NO,
    relativelyStable: YES,
  },
  {
    id: "temporal",
    system: "Temporal",
    recursionFanInStateful: YES,
    customWorkflows: YES,
    agentHarnessSupport: NO,
    fileFirst: NO,
    durableWorkflows: YES,
    relativelyStable: YES,
  },
];

export const agentFactoryComparisonColumns: DataTableColumn<AgentFactoryComparisonRow>[] =
  [
    {
      id: "system",
      header: "System",
      cell: (row) => row.system,
    },
    {
      id: "recursion-fan-in-stateful",
      header: "Recursion, fan-in, stateful",
      cell: (row) => row.recursionFanInStateful,
    },
    {
      id: "custom-workflows",
      header: "Custom workflows",
      cell: (row) => row.customWorkflows,
    },
    {
      id: "agent-harness-support",
      header: "Agent harness support",
      cell: (row) => row.agentHarnessSupport,
    },
    {
      id: "file-first",
      header: "File-first / check-in files",
      cell: (row) => row.fileFirst,
    },
    {
      id: "durable-workflows",
      header: "Durable workflows",
      cell: (row) => row.durableWorkflows,
    },
    {
      id: "relatively-stable",
      header: "Relatively stable",
      cell: (row) => row.relativelyStable,
    },
  ];

export const AGENT_FACTORIES_COMPARISON_TABLE_LABEL =
  "Comparison of agent factories and orchestration systems";

/**
 * Primary teaching DataTable for the comparing-agent-factories blog post.
 */
export function AgentFactoriesComparisonTable() {
  return (
    <div data-testid="agent-factories-comparison-table">
      <DataTable
        ariaLabel={AGENT_FACTORIES_COMPARISON_TABLE_LABEL}
        caption={AGENT_FACTORIES_COMPARISON_TABLE_LABEL}
        columns={agentFactoryComparisonColumns}
        data={agentFactoryComparisonRows}
        getRowKey={(row) => row.id}
        state="success"
      />
    </div>
  );
}
