import { Fragment } from "react";

import { cn } from "@/lib/utils";
import { fmtSigned } from "@/components/reports/profit-loss/pl-statement-table";
import type {
  MonthlyProfitAndLossReport,
  PlPeriodFigure,
  PlPeriodGroup,
  PlPeriodLine,
} from "@/types/reports/type";

/** Zero renders as a dash so the eye lands on the months that moved. */
const cell = (n: number) => (n === 0 ? "–" : fmtSigned(n));

// The first column sticks while the months scroll. It needs an opaque
// background or the scrolling numbers show through it.
const stickyCell = "sticky left-0 z-10 bg-white";
const numCell = "px-3 py-2 text-right font-mono tabular-nums whitespace-nowrap";

function AmountCells({
  values,
  total,
  className,
}: {
  values: number[];
  total: number;
  className?: string;
}) {
  return (
    <>
      {values.map((v, i) => (
        <td key={i} className={cn(numCell, className)}>
          {cell(v)}
        </td>
      ))}
      <td className={cn(numCell, "border-l bg-gray-50/40 font-medium", className)}>
        {cell(total)}
      </td>
    </>
  );
}

function LineRow({
  line,
  indent,
  emphasize,
}: {
  line: PlPeriodLine;
  indent?: boolean;
  emphasize?: boolean;
}) {
  return (
    <tr className="hover:bg-gray-50/50">
      <td className={cn(stickyCell, "py-2 pr-4", indent ? "pl-10" : "pl-4", emphasize && "font-medium")}>
        <span className="mr-2 font-mono text-xs text-muted-foreground">{line.code}</span>
        {line.name}
      </td>
      <AmountCells values={line.amounts} total={line.amount} />
    </tr>
  );
}

/**
 * One section across the months. Mirrors the single-period table's row
 * grammar — caption, lines, indented children, an explicit "<parent> total"
 * subtotal, then the section total — with one cell per month plus Total.
 */
function SectionRows({
  title,
  group,
  columns,
}: {
  title: string;
  group: PlPeriodGroup;
  columns: number;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={columns}
          className={cn(stickyCell, "bg-gray-50/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500")}
        >
          {title}
        </td>
      </tr>
      {group.lines.length === 0 ? (
        <tr>
          <td colSpan={columns} className="px-4 py-3 text-center text-xs text-muted-foreground">
            No activity
          </td>
        </tr>
      ) : (
        group.lines.map((line) => (
          <Fragment key={line.accountId ?? line.code}>
            <LineRow line={line} emphasize={line.children.length > 0} />
            {line.children.map((child) => (
              <LineRow key={child.accountId ?? child.code} line={child} indent />
            ))}
            {line.children.length > 0 && (
              <tr className="border-t hover:bg-gray-50/50">
                <td className={cn(stickyCell, "py-2 pl-10 pr-4 text-xs italic text-muted-foreground")}>
                  {line.name} total
                </td>
                <AmountCells
                  values={line.totals}
                  total={line.total}
                  className="text-xs italic text-muted-foreground"
                />
              </tr>
            )}
          </Fragment>
        ))
      )}
      <tr className="border-t bg-gray-50/60 font-medium">
        <td className={cn(stickyCell, "bg-gray-50/60 px-4 py-2.5")}>Total {title.toLowerCase()}</td>
        <AmountCells values={group.totals} total={group.total} />
      </tr>
    </>
  );
}

function MilestoneRow({ label, figure }: { label: string; figure: PlPeriodFigure }) {
  const tone = (n: number) => (n < 0 ? "text-neg" : "text-pos");
  return (
    <tr className="border-y bg-gray-100/70">
      <td className={cn(stickyCell, "bg-gray-100/70 px-4 py-3 text-sm font-semibold")}>{label}</td>
      {figure.byPeriod.map((v, i) => (
        <td key={i} className={cn(numCell, "py-3 font-semibold", tone(v))}>
          {fmtSigned(v)}
        </td>
      ))}
      <td className={cn(numCell, "border-l py-3 text-base font-semibold", tone(figure.total))}>
        {fmtSigned(figure.total)}
      </td>
    </tr>
  );
}

/** The income statement with one column per month plus a range total. */
export function PlMonthlyTable({ report }: { report: MonthlyProfitAndLossReport }) {
  const columns = report.periods.length + 2; // account + months + total
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
            <th className={cn(stickyCell, "bg-gray-50/60 px-4 py-2.5")}>
              Account ({report.currencyCode})
            </th>
            {report.periods.map((p) => (
              <th key={`${p.year}-${p.month}`} className="px-3 py-2.5 text-right whitespace-nowrap">
                {p.label}
              </th>
            ))}
            <th className="border-l bg-gray-50/40 px-3 py-2.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          <SectionRows title="Revenue / Sales" group={report.sections.revenue} columns={columns} />
          <SectionRows title="Cost of Sales" group={report.sections.costOfSales} columns={columns} />
          <MilestoneRow label="Gross Profit" figure={report.grossProfit} />
          <SectionRows title="Operating Expenses" group={report.sections.operatingExpenses} columns={columns} />
          <MilestoneRow label="Operating Profit" figure={report.operatingProfit} />
          <SectionRows title="Other Income & Expenses" group={report.sections.otherIncomeAndExpenses} columns={columns} />
          <MilestoneRow label="Net Profit Before Tax" figure={report.netProfitBeforeTax} />
          <SectionRows title="Tax Expense" group={report.sections.taxExpense} columns={columns} />
          <MilestoneRow label="Net Profit After Tax" figure={report.netProfitAfterTax} />
        </tbody>
      </table>
    </div>
  );
}
