import { format } from "date-fns";
import { Scale, ShieldAlert, ShieldCheck, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { fetchBalanceSheet } from "@/lib/actions/accounting-reports-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import type {
  AccountBalanceRow,
  BalanceSheetLine,
} from "@/types/reports/type";

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Fallback for an accounting service that predates the nested `sections`
 * view — every account becomes its own top-level, childless line, which is
 * exactly how this page rendered before.
 */
const asFlatLines = (rows: AccountBalanceRow[]): BalanceSheetLine[] =>
  rows.map((r) => ({
    accountId: r.accountId,
    code: r.code,
    name: r.name,
    amount: r.balance,
    children: [],
    total: r.balance,
  }));

/**
 * Current and non-current are separate sections server-side, but this page
 * presents assets (and liabilities) as one list, so they merge back by code
 * — matching the order of the flat `assets` list, where a current account
 * with a high code like 9000 sorts after a non-current one like 1800.
 * Concatenating the sections instead would silently reorder them.
 */
const mergedByCode = (...groups: BalanceSheetLine[][]): BalanceSheetLine[] =>
  groups.flat().sort((a, b) => a.code.localeCompare(b.code));

function LineRows({
  line,
  depth = 0,
}: {
  line: BalanceSheetLine;
  depth?: number;
}) {
  const hasChildren = line.children.length > 0;
  return (
    <>
      <tr className="hover:bg-gray-50/50">
        <td className="px-4 py-2.5 font-mono text-xs">{line.code}</td>
        <td
          className="px-4 py-2.5"
          style={{ paddingLeft: `${1 + depth * 1.25}rem` }}
        >
          {line.name}
        </td>
        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
          {/* A parent shows its own balance here and the rolled-up figure
              in the total column, so the two are never conflated. */}
          {fmt(line.amount)}
        </td>
        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
          {hasChildren ? fmt(line.total) : ""}
        </td>
      </tr>
      {line.children.map((child) => (
        <LineRows
          key={child.accountId ?? child.code}
          line={child}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

function Section({
  title,
  lines,
  total,
  currency,
}: {
  title: string;
  lines: BalanceSheetLine[];
  total: number;
  currency: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-base font-semibold">{title}</h3>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
              <th className="px-4 py-2.5">Code</th>
              <th className="px-4 py-2.5">Account</th>
              <th className="px-4 py-2.5 text-right">Balance</th>
              <th className="px-4 py-2.5 text-right">Incl. sub-lines</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-4 text-center text-xs text-muted-foreground"
                >
                  No activity
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <LineRows key={line.accountId ?? line.code} line={line} />
              ))
            )}
            <tr className="border-t bg-gray-50/60 font-medium">
              <td colSpan={3} className="px-4 py-2.5">
                Total {title.toLowerCase()}
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                {fmt(total)} {currency}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ asOfDate?: string }>;
}) {
  const params = await searchParams;
  const asOf = params.asOfDate ?? format(new Date(), "yyyy-MM-dd");
  const location = await getCurrentLocation();
  const report = location?.id ? await fetchBalanceSheet(location.id, asOf) : null;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reports", href: "/dashboard" },
          { title: "Balance sheet" },
        ]}
      />
      <PageHeader
        title="Balance sheet"
        subtitle={`As of ${asOf}. Assets = Liabilities + Equity (incl. retained earnings).`}
      />
      <PageBody>
        {!report ? (
          <NoItems itemName="balance sheet data" />
        ) : (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<Scale className="h-3 w-3" />}
                label="Total assets"
                value={fmt(report.totalAssets)}
                unit={report.currencyCode}
              />
              <KpiCard
                icon={<Scale className="h-3 w-3" />}
                label="Total liabilities"
                value={fmt(report.totalLiabilities)}
                unit={report.currencyCode}
              />
              <KpiCard
                icon={<TrendingUp className="h-3 w-3" />}
                label="Total equity"
                value={fmt(report.totalEquity)}
                unit={report.currencyCode}
              />
              <KpiCard
                icon={
                  report.balanced ? (
                    <ShieldCheck className="h-3 w-3" />
                  ) : (
                    <ShieldAlert className="h-3 w-3" />
                  )
                }
                label="Balanced"
                value={report.balanced ? "Yes" : "No"}
                deltaTone={report.balanced ? "pos" : "neg"}
              />
            </KpiStrip>
            <Card>
              <CardContent className="space-y-6 pt-6">
                <Section
                  title="Assets"
                  lines={
                    report.sections
                      ? mergedByCode(
                          report.sections.currentAssets,
                          report.sections.nonCurrentAssets,
                        )
                      : asFlatLines(report.assets)
                  }
                  total={report.totalAssets}
                  currency={report.currencyCode}
                />
                <Section
                  title="Liabilities"
                  lines={
                    report.sections
                      ? mergedByCode(
                          report.sections.currentLiabilities,
                          report.sections.nonCurrentLiabilities,
                        )
                      : asFlatLines(report.liabilities)
                  }
                  total={report.totalLiabilities}
                  currency={report.currencyCode}
                />
                <Section
                  title="Equity"
                  lines={
                    report.sections
                      ? report.sections.equity
                      : asFlatLines(report.equity)
                  }
                  total={report.totalEquity}
                  currency={report.currencyCode}
                />
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
