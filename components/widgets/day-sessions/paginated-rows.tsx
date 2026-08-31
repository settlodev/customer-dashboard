"use client";

/**
 * Client-side pager for a Close-of-Day record list. The rows themselves
 * are server-rendered (RecordRow nodes passed as children); this only
 * slices which page is visible, so a session with dozens of expenses
 * doesn't render as one endless list. With `pageSize` rows or fewer it
 * renders the plain list with no pager chrome.
 */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginatedRows({
  pageSize = 6,
  children,
}: {
  pageSize?: number;
  children: React.ReactNode;
}) {
  const rows = React.Children.toArray(children);
  const [page, setPage] = React.useState(0);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages - 1);

  if (rows.length <= pageSize) {
    return <div className="flex flex-col">{rows}</div>;
  }

  const start = current * pageSize;
  const end = Math.min(start + pageSize, rows.length);

  return (
    <div className="flex flex-col">
      {rows.slice(start, end)}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-2.5">
        <span className="font-mono text-[10.5px] text-muted-foreground">
          {start + 1}–{end} of {rows.length}
        </span>
        <div className="flex items-center gap-1">
          <PagerButton
            label="Previous page"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </PagerButton>
          <span className="min-w-[52px] text-center font-mono text-[10.5px] text-ink-3">
            {current + 1} / {pages}
          </span>
          <PagerButton
            label="Next page"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </PagerButton>
        </div>
      </div>
    </div>
  );
}

function PagerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-line text-ink-3 transition-colors hover:bg-canvas disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
