import { LoadingLabel, Skeleton, panelClass } from "@/components/Skeleton";
import { cn } from "@/lib/utils";

export default function StockLoading() {
  return (
    <div className="flex flex-col gap-8 min-h-screen p-4 md:p-6 lg:p-8">
      <LoadingLabel>Loading stock details</LoadingLabel>
      <div className={cn(panelClass, "flex flex-col gap-6 p-4 md:p-6")}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-9 w-48" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-150 rounded-lg" />
        <Skeleton className="h-100 rounded-lg" />
      </div>
    </div>
  );
}
