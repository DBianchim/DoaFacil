import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-6 sm:px-8 lg:px-14">
      <span className="sr-only" role="status">
        Carregando anúncio…
      </span>
      <Skeleton className="mb-6 h-4 w-60" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12">
        <Skeleton className="h-72 rounded-[20px] sm:h-[420px]" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-56 rounded-card" />
          <Skeleton className="h-13 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
