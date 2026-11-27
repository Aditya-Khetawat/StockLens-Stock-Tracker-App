import { LoadingLabel, Skeleton, panelClass } from "@/components/Skeleton";
import { cn } from "@/lib/utils";

export default function WatchlistLoading() {
  return (
    <section className="watchlist">
      <LoadingLabel>Loading your watchlist</LoadingLabel>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className={cn(panelClass, "flex flex-col gap-3 p-4")}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    </section>
  );
}
