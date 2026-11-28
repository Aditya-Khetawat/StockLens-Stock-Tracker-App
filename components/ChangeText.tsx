import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { changeDirection, formatSignedPercent, formatSignedUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A gain or loss shown with an arrow and a sign as well as colour, so it reads
 * correctly for colour-blind users and in greyscale. A change that rounds to
 * zero is neutral: muted, unsigned and without an arrow.
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
  const direction = changeDirection(value ?? percent ?? 0);
  const Arrow = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : null;
  const parts = [
    value != null ? formatSignedUsd(value) : null,
    percent != null ? (value != null ? `(${formatSignedPercent(percent)})` : formatSignedPercent(percent)) : null,
  ].filter(Boolean);

  return (
    <span
      className={cn(
        "figure inline-flex items-center gap-0.5 whitespace-nowrap",
        direction === "up" ? "text-gain" : direction === "down" ? "text-loss" : "text-fg-muted",
        className,
      )}
    >
      {Arrow && <Arrow className="h-[1em] w-[1em] shrink-0" aria-hidden="true" />}
      {parts.join(" ")}
    </span>
  );
}
