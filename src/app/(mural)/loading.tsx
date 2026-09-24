import { ItemGridSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-10 sm:px-8 lg:px-20">
      <span className="sr-only" role="status">
        Carregando…
      </span>
      <Skeleton className="mb-4 h-7 w-52 rounded-full" />
      <Skeleton className="mb-3 h-12 w-full max-w-xl" />
      <Skeleton className="mb-10 h-12 w-3/4 max-w-lg" />
      <ItemGridSkeleton count={4} />
    </main>
  );
}
