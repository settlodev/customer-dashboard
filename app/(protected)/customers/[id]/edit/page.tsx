import { notFound, redirect } from "next/navigation";
import { UUID } from "node:crypto";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import CustomerForm from "@/components/forms/customer_form";
import {
  fetchCustomerGroups,
  getCustomerById,
} from "@/lib/actions/customer-actions";
import type { Customer, CustomerGroup } from "@/types/customer/type";

type Params = Promise<{ id: string }>;

export default async function CustomerEditPage({ params }: { params: Params }) {
  const { id } = await params;

  // /customers/new is the dedicated create route — bounce there if
  // someone hits the edit URL with a literal "new" id.
  if (id === "new") redirect("/customers/new");

  let customer: Customer | null = null;
  try {
    customer = await getCustomerById(id as UUID);
    if (!customer) notFound();
  } catch {
    throw new Error("Failed to load customer details");
  }

  const groups: CustomerGroup[] = await fetchCustomerGroups().catch(() => []);

  const fullName = `${customer.firstName} ${customer.lastName}`;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Customers", href: "/customers" },
          { title: fullName, href: `/customers/${customer.id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title={`Edit ${fullName}`}
        subtitle="Update profile, contact, identification, and loyalty preferences."
      />
      <PageBody>
        <CustomerForm item={customer} groups={groups} />
      </PageBody>
    </PageShell>
  );
}
