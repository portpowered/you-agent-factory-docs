import { describe, expect, test } from "bun:test";
import {
  OPENAPI_SPIKE_PEER_NOTES,
  OPENAPI_SPIKE_RECORDED_STACK,
  OPENAPI_SPIKE_SELECTED_VERSION,
  OPENAPI_SPIKE_STATUS,
  OPENAPI_SPIKE_UPGRADE_CANDIDATE,
} from "./dependency-selection";

async function readInstalledVersion(packageName: string): Promise<string> {
  const packageJsonPath = Bun.resolveSync(`${packageName}/package.json`, ".");
  const packageJson = (await Bun.file(packageJsonPath).json()) as {
    version: string;
  };
  return packageJson.version;
}

describe("W01 OpenAPI spike dependency selection", () => {
  test("marks the OpenAPI pin as temporary non-production", () => {
    expect(OPENAPI_SPIKE_STATUS).toBe("non-production-temporary");
  });

  test("selects fumadocs-openapi 10.10.3 compatible with the 16.9 stack", async () => {
    expect(OPENAPI_SPIKE_SELECTED_VERSION).toBe("10.10.3");
    expect(await readInstalledVersion("fumadocs-openapi")).toBe(
      OPENAPI_SPIKE_SELECTED_VERSION,
    );

    const openapiPackage = (await Bun.file(
      Bun.resolveSync("fumadocs-openapi/package.json", "."),
    ).json()) as {
      peerDependencies: Record<string, string>;
    };

    expect(openapiPackage.peerDependencies["fumadocs-core"]).toBe("^16.9.0");
    expect(openapiPackage.peerDependencies["fumadocs-ui"]).toBe("^16.9.0");
    expect(OPENAPI_SPIKE_PEER_NOTES.selected.compatibleWithRecordedStack).toBe(
      true,
    );
  });

  test("records the current stack versions used for the selection", async () => {
    expect(await readInstalledVersion("fumadocs-core")).toBe(
      OPENAPI_SPIKE_RECORDED_STACK.fumadocsCore,
    );
    expect(await readInstalledVersion("fumadocs-ui")).toBe(
      OPENAPI_SPIKE_RECORDED_STACK.fumadocsUi,
    );
    expect(await readInstalledVersion("fumadocs-mdx")).toBe(
      OPENAPI_SPIKE_RECORDED_STACK.fumadocsMdx,
    );
    expect(await readInstalledVersion("next")).toBe(
      OPENAPI_SPIKE_RECORDED_STACK.next,
    );
    expect(await readInstalledVersion("react")).toBe(
      OPENAPI_SPIKE_RECORDED_STACK.react,
    );
  });

  test("records a coordinated 11.2 / Fumadocs 16.10 upgrade candidate with risk", () => {
    expect(OPENAPI_SPIKE_UPGRADE_CANDIDATE).toEqual({
      fumadocsOpenapi: "11.2.2",
      fumadocsCore: "16.10.7",
      fumadocsUi: "16.10.7",
    });
    expect(
      OPENAPI_SPIKE_PEER_NOTES.upgradeCandidate.compatibleWithRecordedStack,
    ).toBe(false);
    expect(OPENAPI_SPIKE_PEER_NOTES.upgradeCandidate.upgradeRisk).toMatch(
      /coordinated fumadocs-core \+ fumadocs-ui/i,
    );
    expect(OPENAPI_SPIKE_PEER_NOTES.upgradeCandidate.requiresFumadocsCore).toBe(
      "^16.10.0",
    );
  });
});
