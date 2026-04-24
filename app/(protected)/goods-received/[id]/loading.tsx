import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GrnDetailLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <Skeleton className="h-4 w-60 rounded-md" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-44 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-xl shadow-sm">
            <CardContent className="py-4 space-y-2">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="px-2 sm:px-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-3 border-b pb-2">
              <Skeleton className="h-3 col-span-2 rounded-md" />
              <Skeleton className="h-3 rounded-md" />
              <Skeleton className="h-3 rounded-md" />
              <Skeleton className="h-3 rounded-md" />
              <Skeleton className="h-3 rounded-md" />
              <Skeleton className="h-3 rounded-md" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-3 py-2">
                <Skeleton className="h-4 col-span-2 rounded-md" />
                <Skeleton className="h-4 rounded-md" />
                <Skeleton className="h-4 rounded-md" />
                <Skeleton className="h-4 rounded-md" />
                <Skeleton className="h-4 rounded-md" />
                <Skeleton className="h-4 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-4 pb-4 space-y-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
