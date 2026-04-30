import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSupplier } from "@/lib/actions/supplier-actions";
import { fetchSupplierPricing } from "@/lib/actions/supplier-pricing-actions";
import { fetchSourceListForSupplier } from "@/lib/actions/supplier-source-list-actions";
import { getSupplierPerformance } from "@/lib/actions/supplier-performance-actions";
import { getAuditLogByEntity } from "@/lib/actions/audit-log-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { LinkSettloSupplierDialog } from "@/components/widgets/supplier/link-settlo-dialog";
import { SupplierStatusActions } from "@/components/widgets/supplier/status-actions";
import { SupplierDetailView } from "./supplier-detail-view";

type Params = Promise<{ id: string }>;

export default async function SupplierDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  const [currency, pricing, sourceList, performance, auditPage] = await Promise.all([
    getLocationCurrency(),
    fetchSupplierPricing(id),
    fetchSourceListForSupplier(id),
    getSupplierPerformance(id),
    getAuditLogByEntity("SUPPLIER", id, 0, 100),
  ]);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Suppliers", href: "/suppliers" },
          { title: supplier.name },
        ]}
      />
      <PageHeader
        title={supplier.name}
        titleAccessory={
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              supplier.archivedAt
                ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            }`}
          >
            {supplier.archivedAt ? "Archived" : "Active"}
          </span>
        }
        subtitle={
          <>
            {supplier.contactPersonName}
            {supplier.contactPersonPhone
              ? ` · ${supplier.contactPersonPhone}`
              : ""}
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/suppliers/${id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <LinkSettloSupplierDialog supplier={supplier} />
            <SupplierStatusActions supplier={supplier} />
          </>
        }
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard
          label="Email"
          value={supplier.email || "\u2014"}
          link={supplier.email ? `mailto:${supplier.email}` : undefined}
        />
        <InfoCard label="Company phone" value={supplier.phone || "\u2014"} />
        <InfoCard label="Registration" value={registrationSummary(supplier)} />
      </div>

        <SupplierDetailView
          supplier={supplier}
          currency={currency}
          pricing={pricing}
          sourceList={sourceList}
          performance={performance}
          auditEntries={auditPage.content}
        />
      </PageBody>
    </PageShell>
  );
}

function InfoCard({
  label,
  value,
  link,
}: {
  label: string;
  value: string;
  link?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        {link ? (
          <a
            href={link}
            className="text-sm font-medium text-primary hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium break-all">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

function registrationSummary(supplier: {
  registrationNumber: string | null;
  tinNumber: string | null;
}): string {
  const pieces: string[] = [];
  if (supplier.registrationNumber) pieces.push(`Reg: ${supplier.registrationNumber}`);
  if (supplier.tinNumber) pieces.push(`TIN: ${supplier.tinNumber}`);
  return pieces.length > 0 ? pieces.join(" · ") : "\u2014";
}
