import { ItemGridSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <main aria-busy="true" className="flex-1">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-5 sm:px-8 lg:px-14">
          <Skeleton className="h-11 w-full max-w-[440px]" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1440px] px-4 pt-7 sm:px-8 lg:px-14">
        <Skeleton className="mb-6 h-5 w-40" />
        <ItemGridSkeleton count={8} />
      </div>
    </main>
  );
}
