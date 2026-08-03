/**
 * DetailTable — the `.od-tbl` treatment: mono uppercase tracked headers on
 * canvas, hairline row dividers, right-aligned tabular numerals, a dimmed
 * tone for empty/placeholder cells, and an optional totals row. Values for
 * padding/typography are pulled from the sales-order page's own local `Th` +
 * `ItemsTable` cell classes (`order-detail-view.tsx`), which already ship
 * this exact treatment.
 */

import { cn } from "@/lib/utils";

export function DetailTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-[13px]", className)}>
        {children}
      </table>
    </div>
  );
}

export function DetailTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
}

export function DetailTh({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-line bg-canvas px-3.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

export function DetailTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function DetailTd({
  children,
  align = "left",
  dim,
  strong,
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  /** Dimmed-cell tone — e.g. a placeholder "—" or a zero value. */
  dim?: boolean;
  /** Bold emphasis — used by totals-row cells and line-total cells. */
  strong?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-3.5 py-3.5 align-top",
        align === "right" && "text-right tabular-nums",
        dim
          ? "font-medium text-muted-2"
          : strong
            ? "font-semibold text-ink"
            : "text-ink",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function DetailTableTotals({ children }: { children: React.ReactNode }) {
  return (
    <tfoot>
      <tr className="border-t border-line-2 bg-surface">{children}</tr>
    </tfoot>
  );
}
