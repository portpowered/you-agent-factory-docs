"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  type ParticleSphereThemeKnobs,
  resolveParticleSphereTheme,
} from "./particle-sphere.theme";
import {
  createParticleSphereRestPose,
  type Particle3D,
  rotateParticlesY,
} from "./particle-sphere-simulation";

export type ParticleSphereProps = {
  className?: string;
  /**
   * Optional theme knob overrides (tests / future theme wiring).
   * Defaults come from particle-sphere.theme.ts.
   */
  theme?: Partial<ParticleSphereThemeKnobs>;
};

export type ParticleSphereMotionMode = "static" | "animated";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function paintSphereFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: readonly Particle3D[],
): void {
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const scale = Math.min(width, height) * 0.42;

  // Soft radial wash so an empty canvas never reads as broken.
  const wash = ctx.createRadialGradient(
    cx,
    cy,
    scale * 0.15,
    cx,
    cy,
    scale * 1.15,
  );
  wash.addColorStop(0, "rgba(56, 120, 160, 0.18)");
  wash.addColorStop(1, "rgba(56, 120, 160, 0)");
  ctx.fillStyle = wash;
  ctx.beginPath();
  ctx.arc(cx, cy, scale * 1.15, 0, Math.PI * 2);
  ctx.fill();

  const sorted = [...particles].sort((a, b) => a.z - b.z);

  for (const p of sorted) {
    const depth = (p.z + 1) / 2;
    const px = cx + p.x * scale;
    const py = cy - p.y * scale;
    const radius = 1.1 + depth * 1.7;
    const alpha = 0.25 + depth * 0.7;

    ctx.beginPath();
    ctx.fillStyle = `rgba(210, 232, 245, ${alpha.toFixed(3)})`;
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Canvas 2D particle sphere for homepage hero integrate (W-sphere).
 * Public contract: `<ParticleSphere className? />`.
 */
export function ParticleSphere({ className, theme }: ParticleSphereProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolvedTheme = resolveParticleSphereTheme(theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const reduceMotion = prefersReducedMotion();
    const motionMode: ParticleSphereMotionMode = reduceMotion
      ? "static"
      : "animated";
    host.dataset.particleSphereMotion = motionMode;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { particles: restParticles } = createParticleSphereRestPose(theme);

    let frameId = 0;
    let running = true;
    let angle = 0;

    const resizeAndPaint = (particles: readonly Particle3D[]) => {
      const rect = host.getBoundingClientRect();
      const cssWidth = Math.max(1, Math.floor(rect.width) || 320);
      const cssHeight = Math.max(1, Math.floor(rect.height) || 320);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintSphereFrame(ctx, cssWidth, cssHeight, particles);
    };

    const tick = () => {
      if (!running) return;
      angle += 0.008;
      const rotated = rotateParticlesY(restParticles, angle);
      resizeAndPaint(rotated);
      frameId = window.requestAnimationFrame(tick);
    };

    // Reduced-motion: one static rest-pose paint, no continuous rAF loop.
    resizeAndPaint(restParticles);
    if (!reduceMotion) {
      frameId = window.requestAnimationFrame(tick);
    }

    const observer = new ResizeObserver(() => {
      if (reduceMotion) {
        resizeAndPaint(restParticles);
        return;
      }
      const rotated = rotateParticlesY(restParticles, angle);
      resizeAndPaint(rotated);
    });
    observer.observe(host);

    return () => {
      running = false;
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [theme]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn("relative h-full w-full min-h-0 min-w-0", className)}
      data-particle-sphere=""
      data-particle-count={resolvedTheme.particleCount}
      data-particle-repulsion={String(resolvedTheme.repulsion)}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        data-particle-sphere-canvas=""
      />
    </div>
  );
}
