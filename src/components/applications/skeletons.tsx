import { Skeleton } from "@/components/ui/skeleton";

export function ApplicationsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="grid gap-4" aria-busy aria-label="Laddar ansökningar">
      <div className="flex gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid gap-px">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b py-3">
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="hidden h-4 w-20 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApplicationDetailSkeleton() {
  return (
    <div className="grid gap-6" aria-busy aria-label="Laddar ansökan">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="grid gap-6" aria-busy aria-label="Laddar formulär">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
      <Skeleton className="h-14" />
      <Skeleton className="h-48" />
    </div>
  );
}
