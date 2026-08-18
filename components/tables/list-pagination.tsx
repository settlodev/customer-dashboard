"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ListPaginationProps {
  page: number;
  pageCount: number;
  totalElements: number;
  pageLimit: number;
  basePath: string;
}

export function ListPagination({
  page,
  pageCount,
  totalElements,
  pageLimit,
  basePath,
}: ListPaginationProps) {
  if (pageCount <= 1) return null;

  const startItem = (page - 1) * pageLimit + 1;
  const endItem = Math.min(page * pageLimit, totalElements);

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    params.set("page", String(target));
    params.set("limit", String(pageLimit));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className="flex items-center justify-between gap-3 pt-2"
    >
      <span className="text-xs text-muted-foreground">
        {startItem.toLocaleString()}–{endItem.toLocaleString()} of{" "}
        {totalElements.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          asChild={page > 1}
          disabled={page <= 1}
        >
          {page > 1 ? (
            <Link href={hrefFor(page - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Link>
          ) : (
            <span>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </span>
          )}
        </Button>
        <span className="px-2 text-xs text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="ghost"
          size="sm"
          asChild={page < pageCount}
          disabled={page >= pageCount}
        >
          {page < pageCount ? (
            <Link href={hrefFor(page + 1)}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          ) : (
            <span>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </nav>
  );
}
