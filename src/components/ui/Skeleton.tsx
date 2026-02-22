"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/60 ${className}`}
      aria-hidden
    />
  );
}

/** Готовый скелетон для страницы со списком */
export function PageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom bg-surface">
      <div className="px-4 sm:px-6 py-5 border-b border-slate-100 bg-white">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <main className="flex-1 px-4 sm:px-6 py-6">
        <div className="space-y-4 max-w-md">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </main>
    </div>
  );
}
