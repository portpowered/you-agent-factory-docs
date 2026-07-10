import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "../../..");
const deployPagesWorkflowPath = join(
  repoRoot,
  ".github/workflows/deploy-pages.yml",
);

/** Live Pages workflow — not the retired `.github/workflows/deploy.yml`. */
describe("deploy-pages.yml project-site build contract", () => {
  test("live deploy-pages workflow exists", () => {
    expect(existsSync(deployPagesWorkflowPath)).toBe(true);
  });

  test("Build static export sets GITHUB_PAGES_BASE_PATH for make build", () => {
    const workflow = readFileSync(deployPagesWorkflowPath, "utf8");

    const buildStepMatch = workflow.match(
      /- name:\s*Build static export\s*\n([\s\S]*?)(?=\n\s*- name:|\n\s*deploy:)/,
    );
    expect(buildStepMatch).not.toBeNull();

    const buildStep = buildStepMatch?.[1] ?? "";
    expect(buildStep).toMatch(/run:\s*make build\b/);
    expect(buildStep).toMatch(
      /GITHUB_PAGES_BASE_PATH:\s*\/you-agent-factory-docs\b/,
    );
  });

  test("validate job uploads the out/ artifact from that build", () => {
    const workflow = readFileSync(deployPagesWorkflowPath, "utf8");

    expect(workflow).toMatch(/actions\/upload-pages-artifact@v3/);
    expect(workflow).toMatch(/path:\s*out\//);

    const buildIndex = workflow.indexOf("run: make build");
    const uploadIndex = workflow.indexOf("actions/upload-pages-artifact@v3");
    expect(buildIndex).toBeGreaterThan(-1);
    expect(uploadIndex).toBeGreaterThan(buildIndex);
  });
});
