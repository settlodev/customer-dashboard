import { Fragment } from "react";
import { format, startOfYear } from "date-fns";
import { Activity, TrendingUp, CircleDollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { fetchProfitAndLoss } from "@/lib/actions/accounting-reports-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { cn } from "@/lib/utils";
import type { PlSectionGroup } from "@/types/reports/type";

const fmt = (n: number) =>
  Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// IAS 1 statements render negative amounts in parentheses rather than with a
// leading minus sign — the accounting convention. Covers contra-account
// lines and the expense lines netted inside Other Income & Expenses.
const fmtSigned = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));

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
function SectionRows({
  title,
  group,
}: {
  title: string;
  group: PlSectionGroup;
}) {
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
          <td
            colSpan={3}
            className="px-4 py-3 text-center text-xs text-muted-foreground"
          >
            No activity
          </td>
        </tr>
      ) : (
        group.lines.map((line) => (
          <Fragment key={line.accountId ?? line.code}>
            {/* The parent's own row shows its own amount — what was posted
                directly to it, before any children are rolled in. Showing
                `total` here instead would make the children's amounts
                indistinguishable from being included twice. */}
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
            {/* Explicit subtotal: only meaningful when there are children to
                roll up, and labelled with the parent's own name so it reads
                as "this group's total" rather than another account line. */}
            {line.children.length > 0 && (
              <tr className="border-t hover:bg-gray-50/50">
                <td
                  colSpan={2}
                  className="py-2 pl-10 pr-4 text-xs italic text-muted-foreground"
                >
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
 * One of the statement's four computed milestones — Gross Profit, Operating
 * Profit, Net Profit Before Tax, Net Profit After Tax. Always renders a
 * figure the backend computed; never re-derives one from section totals in
 * the browser, so the page and the API cannot disagree.
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

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const params = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  // const startDate =
  //   params.startDate ?? format(subDays(new Date(), 30), "yyyy-MM-dd");
  const startDate =
    params.startDate ?? format(startOfYear(new Date()), "yyyy-MM-dd");
  const endDate = params.endDate ?? today;

  const location = await getCurrentLocation();
  const report = location?.id
    ? await fetchProfitAndLoss(location.id, startDate, endDate)
    : null;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reports", href: "/dashboard" },
          { title: "Profit & Loss" },
        ]}
      />
      <PageHeader
        title="Profit \ loss"
        subtitle={`From ${startDate} to ${endDate}. Revenue minus expenses from posted journals.`}
      />
      <PageBody>
        {!report ? (
          <NoItems itemName="P&L data" />
        ) : (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<TrendingUp className="h-3 w-3" />}
                label="Gross profit"
                value={fmtSigned(report.grossProfit)}
                unit={report.currencyCode}
                deltaTone={report.grossProfit >= 0 ? "pos" : "neg"}
              />
              <KpiCard
                icon={<Activity className="h-3 w-3" />}
                label="Operating profit"
                value={fmtSigned(report.operatingProfit)}
                unit={report.currencyCode}
                deltaTone={report.operatingProfit >= 0 ? "pos" : "neg"}
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Net profit after tax"
                value={fmtSigned(report.netProfitAfterTax)}
                unit={report.currencyCode}
                deltaTone={report.netProfitAfterTax >= 0 ? "pos" : "neg"}
              />
            </KpiStrip>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                        <th className="px-4 py-2.5">Code</th>
                        <th className="px-4 py-2.5">Account</th>
                        <th className="px-4 py-2.5 text-right">
                          Amount ({report.currencyCode})
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <SectionRows
                        title="Revenue / Sales"
                        group={report.sections.revenue}
                      />
                      <SectionRows
                        title="Cost of Sales"
                        group={report.sections.costOfSales}
                      />
                      <MilestoneRow
                        label="Gross Profit"
                        amount={report.grossProfit}
                      />
                      <SectionRows
                        title="Operating Expenses"
                        group={report.sections.operatingExpenses}
                      />
                      <MilestoneRow
                        label="Operating Profit"
                        amount={report.operatingProfit}
                      />
                      <SectionRows
                        title="Other Income & Expenses"
                        group={report.sections.otherIncomeAndExpenses}
                      />
                      <MilestoneRow
                        label="Net Profit Before Tax"
                        amount={report.netProfitBeforeTax}
                      />
                      <SectionRows
                        title="Tax Expense"
                        group={report.sections.taxExpense}
                      />
                      <MilestoneRow
                        label="Net Profit After Tax"
                        amount={report.netProfitAfterTax}
                      />
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
