import { cn } from "@/lib/utils";

/**
 * A diverging bar from a centre rule: losses grow left in red, gains right in
 * green, each drawn at exactly its share of the day's biggest move.
 */
export default function MoveBar({
  percent,
  scale,
  className,
}: {
  percent: number;
  /** The largest absolute move in the list, so bars compare honestly. */
  scale: number;
  className?: string;
}) {
  const width = Math.min(50, (Math.abs(percent) / scale) * 50);
  const up = percent >= 0;
  return (
    <span aria-hidden="true" className={cn("relative block h-1.5 w-full rounded-full bg-raised", className)}>
      <span className="absolute inset-y-[-2px] left-1/2 w-px bg-line-strong" />
      <span
        className={cn("absolute inset-y-0 rounded-full", up ? "left-1/2 bg-gain" : "right-1/2 bg-loss")}
        style={{ width: `${width}%` }}
      />
    </span>
  );
}
