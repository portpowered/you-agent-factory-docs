/**
 * Gray labeled slot stub for the landing-page chassis.
 * Feature lanes replace these via LandingPage slot props.
 */

export type LandingPlaceholderProps = {
  label: string;
  /** Mock section height used to approximate landing proportions. */
  minHeight: number | string;
  className?: string;
};

export function LandingPlaceholder({
  label,
  minHeight,
  className,
}: LandingPlaceholderProps) {
  const resolvedMinHeight =
    typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  return (
    <section
      aria-label={label}
      className={
        className ??
        "flex w-full items-center justify-center border border-neutral-300 bg-neutral-200 text-neutral-700"
      }
      data-landing-placeholder={label}
      style={{ minHeight: resolvedMinHeight }}
    >
      <span className="font-mono text-sm tracking-wide uppercase">{label}</span>
    </section>
  );
}
