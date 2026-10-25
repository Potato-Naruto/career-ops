import { PageFrame } from "@/components/page-frame";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommandsLoading() {
  return (
    <PageFrame>
      <div aria-label="Loading commands">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </PageFrame>
  );
}
