import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import VendorForm from "@/components/forms/vendor_form";
import { getVendor } from "@/lib/actions/vendor-actions";

type Params = Promise<{ id: string }>;

export default async function VendorDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const isNew = id === "new";

  if (isNew) {
    return (
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Vendors", href: "/vendors" },
            { title: "New" },
          ]}
        />
        <PageHeader
          title="Add vendor"
          subtitle="Capture vendor details so they can be referenced from expenses."
        />
        <PageBody>
          <VendorForm item={null} />
        </PageBody>
      </PageShell>
    );
  }

  const vendor = await getVendor(id);
  if (!vendor) notFound();

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Vendors", href: "/vendors" },
          { title: vendor.name },
        ]}
      />
      <PageHeader
        title={vendor.name}
        subtitle={vendor.contactPerson ?? undefined}
        titleAccessory={
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              vendor.active
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {vendor.active ? "Active" : "Inactive"}
          </span>
        }
      />
      <PageBody>
        <VendorForm item={vendor} />
      </PageBody>
    </PageShell>
  );
}
