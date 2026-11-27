import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatSignedPercent, formatSignedUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A gain or loss shown with an arrow and a sign as well as colour, so it reads
 * correctly for colour-blind users and in greyscale.
 */
export default function ChangeText({
  value,
  percent,
  className,
}: {
  /** Dollar change; omit to show the percentage only. */
  value?: number | null;
  percent?: number | null;
  className?: string;
}) {
  const basis = value ?? percent ?? 0;
  const up = basis >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  const parts = [
    value != null ? formatSignedUsd(value) : null,
    percent != null ? (value != null ? `(${formatSignedPercent(percent)})` : formatSignedPercent(percent)) : null,
  ].filter(Boolean);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums",
        up ? "text-gain" : "text-loss",
        className,
      )}
    >
      <Arrow className="h-[1em] w-[1em] shrink-0" aria-hidden="true" />
      {parts.join(" ")}
    </span>
  );
}
