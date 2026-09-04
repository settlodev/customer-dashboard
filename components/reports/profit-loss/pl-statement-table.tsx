import { Fragment } from "react";

import { cn } from "@/lib/utils";
import type { PlSectionGroup, PlSections } from "@/types/reports/type";

const fmt = (n: number) =>
  Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * IAS 1 statements render negative amounts in parentheses rather than with a
 * leading minus sign — the accounting convention. Covers contra-account
 * lines and the expense lines netted inside Other Income & Expenses.
 */
export const fmtSigned = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));

/** One account line. `indent` renders it as a sub-line beneath its parent. */
function LineRow({
  code,
  name,
  amount,
  emphasize,
  indent,
}: {
  code: string;
  name: string;
  amount: number;
  emphasize?: boolean;
  indent?: boolean;
}) {
  return (
    <tr className="hover:bg-gray-50/50">
      <td className="px-4 py-2.5 font-mono text-xs">{code}</td>
      <td
        className={cn(
          "py-2.5",
          indent ? "pl-10 pr-4" : "px-4",
          emphasize && "font-medium",
        )}
      >
        {name}
      </td>
      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
        {fmtSigned(amount)}
      </td>
    </tr>
  );
}

/**
 * One statement section: a caption, its lines, and a total row. A parent
 * line shows its own amount; any children render indented beneath it,
 * followed by an explicit "<parent> total" subtotal row carrying the
 * rolled-up figure — so it's never ambiguous whether the sub-lines are
 * included in the parent's own number or additional to it. Always renders,
 * even with zero lines, so a merchant can see the section is genuinely nil
 * rather than missing from the statement.
 */
function SectionRows({ title, group }: { title: string; group: PlSectionGroup }) {
  return (
    <>
      <tr>
        <td
          colSpan={3}
          className="bg-gray-50/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
        >
          {title}
        </td>
      </tr>
      {group.lines.length === 0 ? (
        <tr>
          <td colSpan={3} className="px-4 py-3 text-center text-xs text-muted-foreground">
            No activity
          </td>
        </tr>
      ) : (
        group.lines.map((line) => (
          <Fragment key={line.accountId ?? line.code}>
            <LineRow
              code={line.code}
              name={line.name}
              amount={line.amount}
              emphasize={line.children.length > 0}
            />
            {line.children.map((child) => (
              <LineRow
                key={child.accountId ?? child.code}
                code={child.code}
                name={child.name}
                amount={child.amount}
                indent
              />
            ))}
            {line.children.length > 0 && (
              <tr className="border-t hover:bg-gray-50/50">
                <td colSpan={2} className="py-2 pl-10 pr-4 text-xs italic text-muted-foreground">
                  {line.name} total
                </td>
                <td className="px-4 py-2 text-right font-mono text-xs italic tabular-nums text-muted-foreground">
                  {fmtSigned(line.total)}
                </td>
              </tr>
            )}
          </Fragment>
        ))
      )}
      <tr className="border-t bg-gray-50/60 font-medium">
        <td colSpan={2} className="px-4 py-2.5">
          Total {title.toLowerCase()}
        </td>
        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
          {fmtSigned(group.total)}
        </td>
      </tr>
    </>
  );
}

/**
 * One of the statement's four computed milestones. Always renders a figure
 * the backend computed; never re-derives one from section totals in the
 * browser, so the page and the API cannot disagree.
 */
function MilestoneRow({ label, amount }: { label: string; amount: number }) {
  return (
    <tr className="border-y bg-gray-100/70">
      <td colSpan={2} className="px-4 py-3 text-sm font-semibold">
        {label}
      </td>
      <td
        className={cn(
          "px-4 py-3 text-right font-mono text-base font-semibold tabular-nums",
          amount < 0 ? "text-neg" : "text-pos",
        )}
      >
        {fmtSigned(amount)}
      </td>
    </tr>
  );
}

export interface PlStatementTableProps {
  sections: PlSections;
  grossProfit: number;
  operatingProfit: number;
  netProfitBeforeTax: number;
  netProfitAfterTax: number;
  currencyCode: string;
}

/** The single-period income statement in IAS 1 section form. */
export function PlStatementTable({
  sections,
  grossProfit,
  operatingProfit,
  netProfitBeforeTax,
  netProfitAfterTax,
  currencyCode,
}: PlStatementTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
            <th className="px-4 py-2.5">Code</th>
            <th className="px-4 py-2.5">Account</th>
            <th className="px-4 py-2.5 text-right">Amount ({currencyCode})</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          <SectionRows title="Revenue / Sales" group={sections.revenue} />
          <SectionRows title="Cost of Sales" group={sections.costOfSales} />
          <MilestoneRow label="Gross Profit" amount={grossProfit} />
          <SectionRows title="Operating Expenses" group={sections.operatingExpenses} />
          <MilestoneRow label="Operating Profit" amount={operatingProfit} />
          <SectionRows title="Other Income & Expenses" group={sections.otherIncomeAndExpenses} />
          <MilestoneRow label="Net Profit Before Tax" amount={netProfitBeforeTax} />
          <SectionRows title="Tax Expense" group={sections.taxExpense} />
          <MilestoneRow label="Net Profit After Tax" amount={netProfitAfterTax} />
        </tbody>
      </table>
    </div>
  );
}
