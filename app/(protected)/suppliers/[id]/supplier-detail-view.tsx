"use client";

import { useState } from "react";
import {
  Activity,
  DollarSign,
  Gauge,
  History,
  Info,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Supplier } from "@/types/supplier/type";
import type { SupplierPricing } from "@/types/supplier-pricing/type";
import type { SupplierSourceList } from "@/types/supplier-source-list/type";
import type { SupplierPerformance } from "@/types/supplier-performance/type";
import type { AuditLogEntry } from "@/types/audit-log/type";
import { AUDIT_ACTION_LABELS } from "@/types/audit-log/type";
import { SupplierPricingPanel } from "@/components/widgets/supplier/pricing-panel";
import { SupplierSourceListPanel } from "@/components/widgets/supplier/source-list-panel";
import { SupplierPerformancePanel } from "@/components/widgets/supplier/performance-panel";

interface Props {
  supplier: Supplier;
  currency: string;
  pricing: SupplierPricing[];
  sourceList: SupplierSourceList[];
  performance: SupplierPerformance[];
  auditEntries: AuditLogEntry[];
}

const TABS = [
  { key: "overview", label: "Overview", icon: Info },
  { key: "pricing", label: "Pricing", icon: DollarSign },
  { key: "source-list", label: "Source list", icon: ListChecks },
  { key: "performance", label: "Performance", icon: Gauge },
  { key: "activity", label: "Activity", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function SupplierDetailView({
  supplier,
  currency,
  pricing,
  sourceList,
  performance,
  auditEntries,
}: Props) {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-6">
      <div className="border-b overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            let badge: string | null = null;
            if (t.key === "pricing" && pricing.length > 0) {
              badge = String(pricing.length);
            }
            if (t.key === "source-list" && sourceList.length > 0) {
              badge = String(sourceList.length);
            }
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                {badge && (
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" && <OverviewTab supplier={supplier} />}
      {tab === "pricing" && (
        <SupplierPricingPanel
          supplierId={supplier.id}
          defaultCurrency={currency}
          pricing={pricing}
        />
      )}
      {tab === "source-list" && (
        <SupplierSourceListPanel supplierId={supplier.id} entries={sourceList} />
      )}
      {tab === "performance" && (
        <SupplierPerformancePanel metrics={performance} />
      )}
      {tab === "activity" && <ActivityTab entries={auditEntries} />}
    </div>
  );
}

// ── Overview tab ────────────────────────────────────────────────────

function OverviewTab({ supplier }: { supplier: Supplier }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Company
          </h3>
          <Row label="Supplier name" value={supplier.name} />
          <Row label="Email" value={supplier.email || "\u2014"} />
          <Row label="Company phone" value={supplier.phone || "\u2014"} />
          <Row label="Address" value={supplier.address || "\u2014"} multiline />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Contact person
          </h3>
          <Row label="Name" value={supplier.contactPersonName} />
          <Row label="Phone" value={supplier.contactPersonPhone} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Registration
          </h3>
          <Row label="Registration #" value={supplier.registrationNumber || "\u2014"} />
          <Row label="TIN" value={supplier.tinNumber || "\u2014"} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Marketplace link
          </h3>
          {supplier.linkedToSettloSupplier ? (
            <>
              <Row label="Linked to" value={supplier.settloSupplierName ?? "Settlo supplier"} />
              <p className="text-xs text-muted-foreground">
                This supplier is paired with a Settlo-verified marketplace
                record. Financing and compliance details flow from the
                marketplace profile.
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Not linked to a marketplace supplier. Use the &quot;Link to
              marketplace&quot; button above to pair this supplier with a
              verified record.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span
        className={`text-sm font-medium ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

// ── Activity tab ────────────────────────────────────────────────────

function ActivityTab({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No activity recorded for this supplier yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Recent activity
        </h3>
        <div className="rounded-md border overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.staffName ?? <span className="text-muted-foreground">\u2014</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[360px]">
                    {entry.details ? (
                      <span className="line-clamp-2 whitespace-pre-wrap">
                        {entry.details}
                      </span>
                    ) : (
                      "\u2014"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
