import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isOpenApiProductionDependency,
  OPENAPI_PRODUCTION_ASYNCAPI_POLICY,
  OPENAPI_PRODUCTION_DEPENDENCY_SET,
  OPENAPI_PRODUCTION_PEER_NOTES,
  OPENAPI_PRODUCTION_PIN_STATUS,
  OPENAPI_PRODUCTION_RECORDED_STACK,
  OPENAPI_PRODUCTION_SELECTED_VERSION,
  OPENAPI_PRODUCTION_UPGRADE_CANDIDATE,
} from "./dependency-selection";

async function readInstalledVersion(packageName: string): Promise<string> {
  const packageJsonPath = Bun.resolveSync(`${packageName}/package.json`, ".");
  const packageJson = (await Bun.file(packageJsonPath).json()) as {
    version: string;
  };
  return packageJson.version;
}

function readRootPackageDependencies(): Record<string, string> {
  const packageJson = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf8"),
  ) as {
    dependencies?: Record<string, string>;
  };
  return packageJson.dependencies ?? {};
}

describe("W08 production OpenAPI dependency selection", () => {
  test("marks the OpenAPI pin as production ownership", () => {
    expect(OPENAPI_PRODUCTION_PIN_STATUS).toBe("production");
    expect(OPENAPI_PRODUCTION_PEER_NOTES.selected.status).toBe("production");
  });

  test("pins fumadocs-openapi 10.10.3 compatible with the 16.9 stack", async () => {
    expect(OPENAPI_PRODUCTION_SELECTED_VERSION).toBe("10.10.3");
    expect(await readInstalledVersion("fumadocs-openapi")).toBe(
      OPENAPI_PRODUCTION_SELECTED_VERSION,
    );

    const openapiPackage = (await Bun.file(
      Bun.resolveSync("fumadocs-openapi/package.json", "."),
    ).json()) as {
      peerDependencies: Record<string, string>;
    };

    expect(openapiPackage.peerDependencies["fumadocs-core"]).toBe("^16.9.0");
    expect(openapiPackage.peerDependencies["fumadocs-ui"]).toBe("^16.9.0");
    expect(
      OPENAPI_PRODUCTION_PEER_NOTES.selected.compatibleWithRecordedStack,
    ).toBe(true);

    const rootDependencies = readRootPackageDependencies();
    expect(rootDependencies["fumadocs-openapi"]).toBe(
      OPENAPI_PRODUCTION_SELECTED_VERSION,
    );
  });

  test("records the current stack versions used for the production pin", async () => {
    expect(await readInstalledVersion("fumadocs-core")).toBe(
      OPENAPI_PRODUCTION_RECORDED_STACK.fumadocsCore,
    );
    expect(await readInstalledVersion("fumadocs-ui")).toBe(
      OPENAPI_PRODUCTION_RECORDED_STACK.fumadocsUi,
    );
    expect(await readInstalledVersion("fumadocs-mdx")).toBe(
      OPENAPI_PRODUCTION_RECORDED_STACK.fumadocsMdx,
    );
    expect(await readInstalledVersion("next")).toBe(
      OPENAPI_PRODUCTION_RECORDED_STACK.next,
    );
    expect(await readInstalledVersion("react")).toBe(
      OPENAPI_PRODUCTION_RECORDED_STACK.react,
    );
  });

  test("records a coordinated 11.2 / Fumadocs 16.10 upgrade candidate with risk", () => {
    expect(OPENAPI_PRODUCTION_UPGRADE_CANDIDATE).toEqual({
      fumadocsOpenapi: "11.2.2",
      fumadocsCore: "16.10.7",
      fumadocsUi: "16.10.7",
    });
    expect(
      OPENAPI_PRODUCTION_PEER_NOTES.upgradeCandidate
        .compatibleWithRecordedStack,
    ).toBe(false);
    expect(OPENAPI_PRODUCTION_PEER_NOTES.upgradeCandidate.upgradeRisk).toMatch(
      /coordinated fumadocs-core \+ fumadocs-ui/i,
    );
    expect(
      OPENAPI_PRODUCTION_PEER_NOTES.upgradeCandidate.requiresFumadocsCore,
    ).toBe("^16.10.0");
  });

  test("excludes @fumadocs/asyncapi from the production pin set", () => {
    expect(OPENAPI_PRODUCTION_ASYNCAPI_POLICY.pinnedForProduction).toBe(false);
    expect(OPENAPI_PRODUCTION_ASYNCAPI_POLICY.requiredForApiPageSummaries).toBe(
      false,
    );
    expect(OPENAPI_PRODUCTION_ASYNCAPI_POLICY.justification).toMatch(/hybrid/i);
    expect(isOpenApiProductionDependency("@fumadocs/asyncapi")).toBe(false);
    expect(OPENAPI_PRODUCTION_DEPENDENCY_SET).not.toContain(
      "@fumadocs/asyncapi",
    );
    expect(OPENAPI_PRODUCTION_DEPENDENCY_SET).toContain("fumadocs-openapi");
    expect(isOpenApiProductionDependency("fumadocs-openapi")).toBe(true);
  });
});
