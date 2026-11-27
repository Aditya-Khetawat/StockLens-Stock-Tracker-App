import { LoadingLabel, Skeleton, panelClass } from "@/components/Skeleton";
import { cn } from "@/lib/utils";

export default function TradeHistoryLoading() {
  return (
    <div className="space-y-6 md:space-y-8">
      <LoadingLabel>Loading your trade history</LoadingLabel>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className={cn(panelClass, "flex flex-col gap-3 p-4 md:p-6")}>
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}
