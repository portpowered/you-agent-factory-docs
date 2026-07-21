import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ParticleSphere } from "./ParticleSphere";
import {
  DEFAULT_PARTICLE_SPHERE_THEME,
  resolveParticleSphereTheme,
} from "./particle-sphere.theme";
import {
  applyRepulsion,
  buildParticleSphereSimulationConfig,
  createParticleSphereRestPose,
  createSphereParticles,
  meanNearestNeighborDistance,
} from "./particle-sphere-simulation";

describe("particle-sphere.theme", () => {
  test("resolveParticleSphereTheme applies typed local defaults", () => {
    expect(resolveParticleSphereTheme()).toEqual({
      particleCount: DEFAULT_PARTICLE_SPHERE_THEME.particleCount,
      repulsion: DEFAULT_PARTICLE_SPHERE_THEME.repulsion,
    });
  });

  test("resolveParticleSphereTheme accepts overrides for count and repulsion", () => {
    expect(
      resolveParticleSphereTheme({ particleCount: 120, repulsion: 0.9 }),
    ).toEqual({ particleCount: 120, repulsion: 0.9 });
  });
});

describe("particle-sphere-simulation", () => {
  test("buildParticleSphereSimulationConfig uses theme knobs", () => {
    const defaults = buildParticleSphereSimulationConfig();
    expect(defaults.particleCount).toBe(
      DEFAULT_PARTICLE_SPHERE_THEME.particleCount,
    );
    expect(defaults.repulsion).toBe(DEFAULT_PARTICLE_SPHERE_THEME.repulsion);

    const overridden = buildParticleSphereSimulationConfig({
      particleCount: 64,
      repulsion: 0.8,
    });
    expect(overridden.particleCount).toBe(64);
    expect(overridden.repulsion).toBe(0.8);
  });

  test("particle-count knob observably changes density", () => {
    const low = createSphereParticles(40);
    const high = createSphereParticles(160);
    expect(low).toHaveLength(40);
    expect(high).toHaveLength(160);
    expect(high.length).toBeGreaterThan(low.length);
  });

  test("repulsion knob observably increases mean nearest-neighbor distance", () => {
    const base = createSphereParticles(96);
    const soft = applyRepulsion(base, 0.1);
    const hard = applyRepulsion(base, 0.9);

    const softMean = meanNearestNeighborDistance(soft);
    const hardMean = meanNearestNeighborDistance(hard);

    expect(hardMean).toBeGreaterThan(softMean);
  });

  test("rest pose particle count matches resolved theme", () => {
    const { config, particles } = createParticleSphereRestPose({
      particleCount: 72,
      repulsion: 0.4,
    });
    expect(config.particleCount).toBe(72);
    expect(particles).toHaveLength(72);
  });
});

describe("ParticleSphere", () => {
  afterEach(() => {
    cleanup();
  });

  test("mounts a Canvas 2D surface and applies className to the root host", () => {
    const { container } = render(
      <ParticleSphere className="sphere-host-test" />,
    );

    const host = container.querySelector("[data-particle-sphere]");
    expect(host).toBeTruthy();
    expect(host?.className).toContain("sphere-host-test");

    const canvas = container.querySelector(
      "canvas[data-particle-sphere-canvas]",
    );
    expect(canvas).toBeTruthy();
    expect(host?.getAttribute("aria-hidden")).toBe("true");
  });

  test("applies default theme knobs as observable data attributes", () => {
    render(<ParticleSphere />);

    const marked = document.querySelector("[data-particle-sphere]");
    expect(marked).toBeTruthy();
    expect(marked?.getAttribute("data-particle-count")).toBe(
      String(DEFAULT_PARTICLE_SPHERE_THEME.particleCount),
    );
    expect(marked?.getAttribute("data-particle-repulsion")).toBe(
      String(DEFAULT_PARTICLE_SPHERE_THEME.repulsion),
    );
  });

  test("injected theme knobs change observable density attributes", () => {
    render(<ParticleSphere theme={{ particleCount: 88, repulsion: 0.72 }} />);

    const marked = document.querySelector("[data-particle-sphere]");
    expect(marked?.getAttribute("data-particle-count")).toBe("88");
    expect(marked?.getAttribute("data-particle-repulsion")).toBe("0.72");
  });
});
