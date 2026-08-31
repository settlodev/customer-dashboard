/**
 * Body primitives shared by the printable operational reports (Close of Day,
 * combined daily Z-report). Extracted so the two sheets are visibly one
 * document family — same section rule, same bordered table box, same summary
 * card — rather than two drifting copies of the same slate palette.
 *
 * Print-safe by construction: fixed slate tones, no theme variables, no
 * `dark:` variants (a printable renders on paper, where a dark surface is a
 * ruined page).
 */

import * as React from "react";

import { cn } from "@/lib/utils";

/** Titled band with an optional count and a right-aligned note. */
export function ReportSection({
  title,
  count,
  note,
  children,
}: {
  title: string;
  count?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-10 pt-[30px]">
      <div className="mb-3 flex items-baseline gap-2.5">
        <h3 className="m-0 font-mono text-[12px] font-semibold uppercase tracking-[0.13em] text-slate-700">
          {title}
        </h3>
        {count && (
          <span className="font-mono text-[11px] text-slate-400">{count}</span>
        )}
        {note && (
          <span className="ml-auto text-[12px] text-slate-400">{note}</span>
        )}
      </div>
      {children}
    </section>
  );
}

/** Rounded, bordered frame around a table; drops the last row's rule. */
export function ReportTableBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[10px] border border-slate-200",
        className,
      )}
    >
      <table className="w-full border-collapse [&_tbody_tr:last-child>td]:border-b-0">
        {children}
      </table>
    </div>
  );
}

/** Label / value line for the document's meta block. */
export function ReportKv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-[5px] text-[14px]">
      <span className="text-slate-600">{k}</span>
      <span className="text-right font-semibold text-slate-900">{v}</span>
    </div>
  );
}

/** Big-number summary card. `value` is pre-formatted by the caller. */
export function ReportSumCard({
  label,
  value,
  unit,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-[10px] border border-slate-200 px-4 py-3.5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </div>
      <div
        className={cn(
          "mt-2 font-mono text-[22px] font-bold tabular-nums tracking-[-0.02em]",
          valueClass ?? "text-slate-900",
        )}
      >
        {value}
        <span className="ml-1 text-[11px] font-medium text-slate-400">
          {unit}
        </span>
      </div>
      {sub && <div className="mt-1.5 text-[11.5px] text-slate-600">{sub}</div>}
    </div>
  );
}
