import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import CustomerForm from "@/components/forms/customer_form";
import { fetchCustomerGroups } from "@/lib/actions/customer-actions";
import type { CustomerGroup } from "@/types/customer/type";

// Customer create page. Mirrors the staff `/new` route — groups are
// loaded server-side so the form mounts with a valid `customerGroupId`
// already in defaultValues; merchants without any groups simply see
// the "no group" placeholder in the picker.
export default async function NewCustomerPage() {
  const groups: CustomerGroup[] = await fetchCustomerGroups().catch(() => []);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Customers", href: "/customers" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add customer"
        subtitle="Create a customer record. Loyalty, credit, and contact details can be set now or refined later."
      />
      <PageBody>
        <CustomerForm item={null} groups={groups} />
      </PageBody>
    </PageShell>
  );
}
