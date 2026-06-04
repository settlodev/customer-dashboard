"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Column header that drives server-side ordering through the URL. The list
 * pages paginate on the server (the table only ever receives the current
 * page), so sorting has to round-trip a `?sort=&dir=` param rather than
 * reorder the visible slice in the browser.
 *
 * Click cycles ascending → descending → unsorted (back to the page's
 * default order). `sortKey` must match the value the server reads from
 * `?sort=`.
 */
export function SortableHeader({
  sortKey,
  label,
  className,
}: {
  sortKey: string;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = searchParams.get("sort") === sortKey;
  const dir = searchParams.get("dir") === "desc" ? "desc" : "asc";

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (!isActive) {
      params.set("sort", sortKey);
      params.set("dir", "asc");
    } else if (dir === "asc") {
      params.set("sort", sortKey);
      params.set("dir", "desc");
    } else {
      params.delete("sort");
      params.delete("dir");
    }
    // Re-ordering can shift rows off the current page, so jump back to the
    // first page like the search/filter controls do.
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const Icon = !isActive ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={handleClick}
      className={cn(
        "-ml-2 h-auto px-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] hover:text-ink",
        isActive ? "text-ink" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      <Icon className={cn("ml-1 h-3 w-3", isActive ? "opacity-100" : "opacity-60")} />
    </Button>
  );
}
