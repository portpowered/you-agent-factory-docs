import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  GA_MEASUREMENT_ID_ENV,
  GA_MEASUREMENT_ID_FALLBACK,
} from "@/lib/analytics/ga-measurement-id";
import {
  PRODUCTION_SITE_ORIGIN,
  SITE_ORIGIN_ENV,
} from "@/lib/seo/production-metadata-base";

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
 *
 * The site deploys to the apex custom domain `youagentfactory.com`, so the
 * build step must NOT set a project-site base path — doing so 404s every asset
 * and every Next `<Link>` on the custom domain. The prefixed lane lives in
 * `make test-w20-pages-prefixed-export`, not here.
 *
 * Do not revive retired `.github/workflows/deploy.yml` /
 * `ai-model-reference` inventory expectations as this gate.
 */
describe("deploy-pages.yml apex build contract", () => {
  test("live deploy-pages workflow exists and retired deploy.yml is not the Pages gate", () => {
    expect(existsSync(deployPagesWorkflowPath)).toBe(true);
    expect(existsSync(retiredDeployWorkflowPath)).toBe(false);
  });

  test("Build static export sets no base path and bakes the apex origin plus GA Measurement ID", () => {
    const workflow = readFileSync(deployPagesWorkflowPath, "utf8");

    const buildStepMatch = workflow.match(
      /- name:\s*Build static export\s*\n([\s\S]*?)(?=\n\s*- name:|\n\s*deploy:)/,
    );
    expect(buildStepMatch).not.toBeNull();

    const buildStep = buildStepMatch?.[1] ?? "";
    expect(buildStep).toMatch(/run:\s*make build\b/);

    // The apex deploy must leave GITHUB_PAGES_BASE_PATH unset. Comments
    // explaining the prefixed lane are fine; an actual assignment is not.
    const basePathAssignments = buildStep
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("#"))
      .filter((line) => /GITHUB_PAGES_BASE_PATH\s*:/.test(line));
    expect(basePathAssignments).toEqual([]);

    expect(buildStep).toMatch(
      new RegExp(`${SITE_ORIGIN_ENV}:\\s*${PRODUCTION_SITE_ORIGIN}\\b`),
    );
    expect(buildStep).toMatch(
      new RegExp(
        `${GA_MEASUREMENT_ID_ENV}:\\s*${GA_MEASUREMENT_ID_FALLBACK}\\b`,
      ),
    );
  });

  test("public/CNAME carries the custom domain into the exported artifact", () => {
    const cnamePath = join(repoRoot, "public/CNAME");
    expect(existsSync(cnamePath)).toBe(true);
    expect(readFileSync(cnamePath, "utf8").trim()).toBe(
      new URL(PRODUCTION_SITE_ORIGIN).hostname,
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
    /**
     * The deploy action polls for Pages to finish processing and defaults to
     * giving up after 10 minutes. At ~390 MB the export stopped fitting in that
     * window, so a fully green build stopped reaching the live site — the
     * failure read as a deploy problem rather than a size one. Pinned so the
     * default cannot silently come back.
     */
    expect(workflow).toMatch(/timeout:\s*1800000/);
    expect(workflow).toMatch(/environment:[\s\S]*name:\s*github-pages/);
    expect(workflow).not.toMatch(/ai-model-reference/);
  });
});
