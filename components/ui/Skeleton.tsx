import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[#1e2640]",
        className
      )}
    />
  );
}

export function MatchSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[#0e1220] border border-[#1e2640]">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-6 rounded" />
        <Skeleton className="w-28 h-4" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-8 rounded-lg" />
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-12 h-8 rounded-lg" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="w-28 h-4" />
        <Skeleton className="w-8 h-6 rounded" />
      </div>
    </div>
  );
}

export function GroupSkeleton() {
  return (
    <div className="rounded-2xl bg-[#0e1220] border border-[#1e2640] p-5">
      <Skeleton className="w-32 h-6 mb-4" />
      <div className="space-y-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-6 rounded" />
              <Skeleton className="w-24 h-4" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="w-6 h-4" />
              <Skeleton className="w-6 h-4" />
              <Skeleton className="w-6 h-4" />
            </div>
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <MatchSkeleton key={i} />
      ))}
    </div>
  );
}
