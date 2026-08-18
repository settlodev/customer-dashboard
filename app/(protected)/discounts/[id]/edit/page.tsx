import { notFound, redirect } from "next/navigation";

import { Discount } from "@/types/discount/type";
import { getDiscount } from "@/lib/actions/discount-actions";
import DiscountForm from "@/components/forms/discount_form";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";

type Params = Promise<{ id: string }>;

export default async function EditDiscountPage({ params }: { params: Params }) {
  const { id } = await params;

  // Creating is a sibling route now that /discounts/[id] is a detail view.
  if (id === "new") redirect("/discounts/new");

  let item: Discount | null = null;
  try {
    item = await getDiscount(id);
    if (!item) notFound();
  } catch {
    notFound();
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Discounts", href: "/discounts" },
          { title: item?.name ?? "Discount", href: `/discounts/${id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader title="Edit Discount" subtitle="Update discount rule details" />

      <PageBody>
        <DiscountForm item={item} />
      </PageBody>
    </PageShell>
  );
}
