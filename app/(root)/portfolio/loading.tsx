import { LoadingLabel, Skeleton, panelClass } from "@/components/Skeleton";
import { cn } from "@/lib/utils";

export default function PortfolioLoading() {
  return (
    <div className="space-y-6 md:space-y-8">
      <LoadingLabel>Loading your portfolio</LoadingLabel>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-44" />
      </div>
      <Skeleton className="h-62.5 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn(panelClass, "flex flex-col gap-4 p-6")}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-36" />
          </div>
        ))}
      </div>
      <div className={cn(panelClass, "flex flex-col gap-3 p-4 md:p-6")}>
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}
