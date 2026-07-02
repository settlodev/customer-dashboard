import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { getAccountingLocationSettings } from "@/lib/actions/accounting-location-settings-actions";
import {
  getProforma,
  getProformaTimeline,
} from "@/lib/actions/invoicing-proforma-actions";
import {
  PROFORMA_STATUS_LABELS,
  PROFORMA_STATUS_TONES,
} from "@/types/invoicing/type";

import ProformaForm from "@/components/forms/proforma-form";
import { ProformaDetailClient } from "./proforma-detail-client";

type Params = Promise<{ id: string }>;

export default async function ProformaDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const isNew = id === "new";

  const settings = await getAccountingLocationSettings();
  const defaultCurrency =
    settings.currency || settings.defaultCurrency || "TZS";

  if (isNew) {
    return (
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Proforma invoices", href: "/proforma-invoices" },
            { title: "New" },
          ]}
        />
        <PageHeader
          title="New proforma"
          subtitle="Saved as a draft — share it or convert to an invoice once accepted."
        />
        <PageBody>
          <ProformaForm
            item={null}
            defaultCurrency={defaultCurrency}
            railExtra={
              <div className="rounded-xl border border-line bg-card p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  Tips
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-3">
                  Link a stock item to a line to reserve inventory when the
                  quote converts to an invoice. The proforma auto-expires if it
                  isn&apos;t accepted by its &ldquo;valid until&rdquo; date.
                </p>
              </div>
            }
          />
        </PageBody>
      </PageShell>
    );
  }

  const proforma = await getProforma(id);
  if (!proforma) notFound();

  const timeline = await getProformaTimeline(proforma.id);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Proforma invoices", href: "/proforma-invoices" },
          { title: proforma.proformaNumber },
        ]}
      />
      <PageHeader
        title={proforma.proformaNumber}
        subtitle={proforma.customerName}
        titleAccessory={
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PROFORMA_STATUS_TONES[proforma.status]}`}
          >
            {PROFORMA_STATUS_LABELS[proforma.status]}
          </span>
        }
      />
      <PageBody>
        <ProformaDetailClient proforma={proforma} timeline={timeline} />
      </PageBody>
    </PageShell>
  );
}
