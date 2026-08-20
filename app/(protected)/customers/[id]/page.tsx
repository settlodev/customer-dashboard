import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { UUID } from "node:crypto";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { Customer, CustomerPreference } from "@/types/customer/type";
import { CustomerArBalance } from "@/types/customer-ar/type";
import type {
  CustomerArInvoiceSummary,
  CustomerSignedBill,
} from "@/types/customer-ar-invoice/type";
import {
  fetchCustomerPreferences,
  getCustomerById,
} from "@/lib/actions/customer-actions";
import { getCustomerArBalance } from "@/lib/actions/customer-ar-actions";
import {
  listCustomerArInvoices,
  listCustomerSignedBills,
} from "@/lib/actions/customer-ar-invoice-actions";
import { CustomerDetailView } from "./customer-detail-view";

type Params = Promise<{ id: string }>;

export default async function CustomerPage({ params }: { params: Params }) {
  const { id } = await params;

  if (id === "new") redirect("/customers/new");

  let customer: Customer | null = null;
  let preferences: CustomerPreference[] = [];

  try {
    const customerId = id as UUID;
    const [c, prefs] = await Promise.all([
      getCustomerById(customerId),
      fetchCustomerPreferences(customerId).catch(() => []),
    ]);
    customer = c;
    preferences = prefs ?? [];
  } catch {
    throw new Error("Failed to load customer details");
  }

  if (!customer) notFound();

  // The A/R balance, the bills behind it, and any invoices already raised
  // over them all feed the Outstanding-balance tab — fetched together so the
  // tab renders in one pass. All three fail soft to an empty state.
  const [arBalance, signedBills, arInvoices]: [
    CustomerArBalance | null,
    CustomerSignedBill[],
    CustomerArInvoiceSummary[],
  ] = await Promise.all([
    getCustomerArBalance(customer.id, customer.locationId),
    listCustomerSignedBills(customer.id, customer.locationId),
    listCustomerArInvoices(customer.id),
  ]);

  const fullName = `${customer.firstName} ${customer.lastName}`;

  // Status pill — Active / Inactive shown beside the title.
  const statusLabel = customer.active ? "Active" : "Inactive";
  const statusClass = customer.active
    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  // Subtitle reads "Phone · Email · Group" — collapses dividers when
  // any segment is missing so we don't end up with stray bullets.
  const subtitleParts: string[] = [];
  if (customer.phoneNumber) subtitleParts.push(customer.phoneNumber);
  if (customer.email) subtitleParts.push(customer.email);
  if (customer.customerGroupName)
    subtitleParts.push(customer.customerGroupName);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Customers", href: "/customers" },
          { title: fullName },
        ]}
      />
      <PageHeader
        title={fullName}
        titleAccessory={
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
            {customer.customerAccountNumber && (
              <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                {customer.customerAccountNumber}
              </span>
            )}
          </span>
        }
        subtitle={
          subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/customers/${customer.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <PageBody>
        <CustomerDetailView
          customer={customer}
          preferences={preferences}
          arBalance={arBalance}
          signedBills={signedBills}
          arInvoices={arInvoices}
        />
      </PageBody>
    </PageShell>
  );
}
