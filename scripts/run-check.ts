import { type MakeCheckResult, runMakeCheck } from "@/lib/quality/make-check";

async function spawnStage(
  command: string,
  args: string[],
): Promise<MakeCheckResult> {
  const process = Bun.spawn([command, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);

  return {
    exitCode,
    stdout,
    stderr,
  };
}

const exitCode = await runMakeCheck({
  runner: (stage) => spawnStage(stage.command, stage.args),
  stdout: (message) => console.log(message),
  stderr: (message) => console.error(message),
});

process.exit(exitCode);
