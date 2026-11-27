import { cn } from "@/lib/utils";

/** A pulsing placeholder block shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("rounded bg-raised/60 animate-pulse", className)} />;
}

/** The bordered surface every card and panel uses. */
export const panelClass = "rounded-xl border border-line bg-surface";

/** Screen-reader announcement for a loading page or section. */
export function LoadingLabel({ children }: { children: string }) {
  return (
    <p role="status" className="sr-only">
      {children}
    </p>
  );
}
