import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  GA_MEASUREMENT_ID_ENV,
  GA_MEASUREMENT_ID_FALLBACK,
} from "@/lib/analytics/ga-measurement-id";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";

const repoRoot = join(import.meta.dir, "../../..");
const deployPagesWorkflowPath = join(
  repoRoot,
  ".github/workflows/deploy-pages.yml",
);
const retiredDeployWorkflowPath = join(
  repoRoot,
  ".github/workflows/deploy.yml",
);

/**
 * Live Pages deploy contract for the focused build-contract gate.
 * Do not revive retired `.github/workflows/deploy.yml` /
 * `ai-model-reference` inventory expectations as this gate.
 */
describe("deploy-pages.yml project-site build contract", () => {
  test("live deploy-pages workflow exists and retired deploy.yml is not the Pages gate", () => {
    expect(existsSync(deployPagesWorkflowPath)).toBe(true);
    expect(existsSync(retiredDeployWorkflowPath)).toBe(false);
  });

  test("Build static export sets GITHUB_PAGES_BASE_PATH and GA Measurement ID for make build", () => {
    const workflow = readFileSync(deployPagesWorkflowPath, "utf8");

    const buildStepMatch = workflow.match(
      /- name:\s*Build static export\s*\n([\s\S]*?)(?=\n\s*- name:|\n\s*deploy:)/,
    );
    expect(buildStepMatch).not.toBeNull();

    const buildStep = buildStepMatch?.[1] ?? "";
    expect(buildStep).toMatch(/run:\s*make build\b/);
    expect(buildStep).toMatch(
      new RegExp(
        `GITHUB_PAGES_BASE_PATH:\\s*${BUILT_APP_GITHUB_PAGES_BASE_PATH.replaceAll("/", "\\/")}\\b`,
      ),
    );
    expect(buildStep).not.toMatch(
      /GITHUB_PAGES_BASE_PATH:\s*\/?ai-model-reference\b/,
    );
    expect(buildStep).toMatch(
      new RegExp(
        `${GA_MEASUREMENT_ID_ENV}:\\s*${GA_MEASUREMENT_ID_FALLBACK}\\b`,
      ),
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

  test("Pages deployed-artifact guard runs after make build and before upload without a second full export", () => {
    const workflow = readFileSync(deployPagesWorkflowPath, "utf8");

    const guardStepMatch = workflow.match(
      /- name:\s*Guard Pages deployed artifact\s*\n([\s\S]*?)(?=\n\s*- name:|\n\s*deploy:)/,
    );
    expect(guardStepMatch).not.toBeNull();

    const guardStep = guardStepMatch?.[1] ?? "";
    const guardRunMatch = guardStep.match(/^\s*run:\s*(.+)$/m);
    expect(guardRunMatch?.[1]?.trim()).toBe(
      "make guard-pages-deployed-artifact",
    );
    expect(guardRunMatch?.[1]).not.toMatch(/make build\b/);
    expect(guardRunMatch?.[1]).not.toMatch(/build:export\b/);

    const buildIndex = workflow.indexOf("run: make build");
    const guardIndex = workflow.indexOf(
      "run: make guard-pages-deployed-artifact",
    );
    const uploadIndex = workflow.indexOf("actions/upload-pages-artifact@v3");
    expect(buildIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeGreaterThan(buildIndex);
    expect(uploadIndex).toBeGreaterThan(guardIndex);
  });

  test("workflow under guard is deploy-pages.yml with validate then deploy jobs", () => {
    const workflow = readFileSync(deployPagesWorkflowPath, "utf8");

    expect(workflow).toMatch(/^\s*validate:\s*$/m);
    expect(workflow).toMatch(/^\s*deploy:\s*$/m);
    expect(workflow).toMatch(/needs:\s*validate/);
    expect(workflow).toMatch(/actions\/deploy-pages@v4/);
    expect(workflow).toMatch(/environment:[\s\S]*name:\s*github-pages/);
    expect(workflow).not.toMatch(/ai-model-reference/);
  });
});
