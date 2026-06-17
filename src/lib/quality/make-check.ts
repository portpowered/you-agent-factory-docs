export type MakeCheckStage = {
  id: "content_validation" | "typecheck" | "lint";
  label: string;
  description: string;
  command: string;
  args: string[];
};

export type MakeCheckResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type MakeCheckRunner = (
  stage: MakeCheckStage,
) => Promise<MakeCheckResult>;

export const DEFAULT_MAKE_CHECK_STAGES: MakeCheckStage[] = [
  {
    id: "content_validation",
    label: "content validation",
    description:
      "validate the public content graph and generated search artifact",
    command: "bun",
    args: ["run", "validate:content"],
  },
  {
    id: "typecheck",
    label: "typecheck",
    description: "check TypeScript types",
    command: "bun",
    args: ["run", "typecheck"],
  },
  {
    id: "lint",
    label: "lint",
    description: "run Biome lint checks",
    command: "bun",
    args: ["run", "lint"],
  },
];

export function formatMakeCheckStageStart(stage: MakeCheckStage): string {
  return `[make check] Running ${stage.label} to ${stage.description}...`;
}

export function formatMakeCheckFailure(stage: MakeCheckStage): string {
  const failureReason =
    stage.id === "content_validation"
      ? "Content validation blocked this change for a content-graph or generated-artifact reason."
      : `${stage.label} blocked this change after content validation passed.`;

  return [
    `[make check] ${stage.label} failed.`,
    failureReason,
    `Command: ${stage.command} ${stage.args.join(" ")}`,
  ].join("\n");
}

export function formatMakeCheckSuccess(stages: MakeCheckStage[]): string {
  return `[make check] Passed ${stages.map((stage) => stage.label).join(", ")}.`;
}

export async function runMakeCheck({
  stages = DEFAULT_MAKE_CHECK_STAGES,
  runner,
  stdout,
  stderr,
}: {
  stages?: MakeCheckStage[];
  runner: MakeCheckRunner;
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}): Promise<number> {
  for (const stage of stages) {
    stdout(formatMakeCheckStageStart(stage));
    const result = await runner(stage);

    if (result.stdout.trim().length > 0) {
      stdout(result.stdout.trimEnd());
    }

    if (result.stderr.trim().length > 0) {
      stderr(result.stderr.trimEnd());
    }

    if (result.exitCode !== 0) {
      stderr(formatMakeCheckFailure(stage));
      return result.exitCode;
    }
  }

  stdout(formatMakeCheckSuccess(stages));
  return 0;
}
