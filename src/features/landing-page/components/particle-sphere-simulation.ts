import {
  type ParticleSphereThemeKnobs,
  resolveParticleSphereTheme,
} from "./particle-sphere.theme";

export type Particle3D = {
  x: number;
  y: number;
  z: number;
};

export type Point2D = { x: number; y: number };

/**
 * Push a projected point outside a circular pointer cavity.
 * `strength` fades the displacement so pointer leave restores the rest pose.
 */
export function repelProjectedPoint(
  point: Point2D,
  pointer: Point2D,
  radius: number,
  strength = 1,
): Point2D {
  const dx = point.x - pointer.x;
  const dy = point.y - pointer.y;
  const distance = Math.hypot(dx, dy);
  const safeRadius = Math.max(0, radius);
  const influence = Math.max(0, Math.min(1, strength));

  if (safeRadius === 0 || distance >= safeRadius || influence === 0) {
    return point;
  }

  const directionX = distance > 0.001 ? dx / distance : 1;
  const directionY = distance > 0.001 ? dy / distance : 0;
  const edgeX = pointer.x + directionX * safeRadius;
  const edgeY = pointer.y + directionY * safeRadius;
  const falloff = 1 - distance / safeRadius;
  const blend = influence * (0.72 + falloff * 0.28);

  return {
    x: point.x + (edgeX - point.x) * blend,
    y: point.y + (edgeY - point.y) * blend,
  };
}

export type ParticleSphereSimulationConfig = ParticleSphereThemeKnobs & {
  /** Unit-sphere radius before projection (kept at 1 for math clarity). */
  radius: number;
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Fibonacci-sphere placement on the unit sphere.
 * Deterministic for a given count (no RNG) so tests and frames stay stable.
 */
export function createSphereParticles(count: number): Particle3D[] {
  const n = Math.max(1, Math.floor(count));
  const particles: Particle3D[] = [];

  for (let i = 0; i < n; i += 1) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    particles.push({
      x: Math.cos(theta) * radiusAtY,
      y,
      z: Math.sin(theta) * radiusAtY,
    });
  }

  return particles;
}

function distanceSquared(a: Particle3D, b: Particle3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

/**
 * Longitude-compress a unit-sphere point so neighbors bunch before repulsion.
 */
function clusterTowardMeridian(
  p: Particle3D,
  clusterAmount: number,
): Particle3D {
  const lat = Math.asin(Math.max(-1, Math.min(1, p.y)));
  const lon = Math.atan2(p.z, p.x);
  const compressedLon = lon * (1 - clusterAmount);
  const cosLat = Math.cos(lat);
  const x = cosLat * Math.cos(compressedLon);
  const y = Math.sin(lat);
  const z = cosLat * Math.sin(compressedLon);
  const len = Math.hypot(x, y, z) || 1;
  return { x: x / len, y: y / len, z: z / len };
}

/**
 * Soft repulsion on the unit sphere.
 *
 * Higher strength relaxes farther from a longitude-clustered seed toward the
 * fibonacci rest pose (and slightly past it via neighbor push), which
 * observably increases mean nearest-neighbor distance.
 */
export function applyRepulsion(
  particles: readonly Particle3D[],
  strength: number,
): Particle3D[] {
  if (particles.length === 0) {
    return [];
  }

  const clamped = Math.max(0, strength);
  // Always start clustered; strength 0 keeps the tight pack.
  const clustered = particles.map((p) => clusterTowardMeridian(p, 0.72));
  if (clamped === 0) {
    return clustered;
  }

  const blend = Math.min(1, clamped);
  const blended = clustered.map((c, i) => {
    const target = particles[i];
    const x = c.x + (target.x - c.x) * blend;
    const y = c.y + (target.y - c.y) * blend;
    const z = c.z + (target.z - c.z) * blend;
    const len = Math.hypot(x, y, z) || 1;
    return { x: x / len, y: y / len, z: z / len };
  });

  // Extra neighbor push for strength > 0 so separation keeps climbing with the knob.
  const pushScale = clamped * 0.045;
  const neighborWindow = Math.min(
    28,
    Math.max(6, Math.floor(particles.length / 16)),
  );
  const result = blended.map((p) => ({ ...p }));

  for (let i = 0; i < result.length; i += 1) {
    let fx = 0;
    let fy = 0;
    let fz = 0;
    const start = Math.max(0, i - neighborWindow);
    const end = Math.min(result.length, i + neighborWindow + 1);

    for (let j = start; j < end; j += 1) {
      if (j === i) continue;
      const a = blended[i];
      const b = blended[j];
      const d2 = distanceSquared(a, b);
      if (d2 < 1e-10 || d2 > 0.18) continue;
      const inv = 1 / d2;
      fx += (a.x - b.x) * inv;
      fy += (a.y - b.y) * inv;
      fz += (a.z - b.z) * inv;
    }

    const nx = blended[i].x + fx * pushScale;
    const ny = blended[i].y + fy * pushScale;
    const nz = blended[i].z + fz * pushScale;
    const len = Math.hypot(nx, ny, nz) || 1;
    result[i] = { x: nx / len, y: ny / len, z: nz / len };
  }

  return result;
}

export function meanNearestNeighborDistance(
  particles: readonly Particle3D[],
): number {
  if (particles.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < particles.length; i += 1) {
    let best = Number.POSITIVE_INFINITY;
    for (let j = 0; j < particles.length; j += 1) {
      if (i === j) continue;
      const d = Math.sqrt(distanceSquared(particles[i], particles[j]));
      if (d < best) best = d;
    }
    total += best;
  }

  return total / particles.length;
}

export function rotateParticlesY(
  particles: readonly Particle3D[],
  angleRadians: number,
): Particle3D[] {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  return particles.map((p) => ({
    x: p.x * cos + p.z * sin,
    y: p.y,
    z: -p.x * sin + p.z * cos,
  }));
}

export function buildParticleSphereSimulationConfig(
  overrides?: Partial<ParticleSphereThemeKnobs>,
): ParticleSphereSimulationConfig {
  const theme = resolveParticleSphereTheme(overrides);
  return {
    ...theme,
    radius: 1,
  };
}

/**
 * Build the rest pose used for the first painted frame (and static reduced-motion).
 */
export function createParticleSphereRestPose(
  overrides?: Partial<ParticleSphereThemeKnobs>,
): { config: ParticleSphereSimulationConfig; particles: Particle3D[] } {
  const config = buildParticleSphereSimulationConfig(overrides);
  const seeded = createSphereParticles(config.particleCount);
  const particles = applyRepulsion(seeded, config.repulsion);
  return { config, particles };
}
