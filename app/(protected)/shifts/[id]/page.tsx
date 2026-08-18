import { UUID } from "node:crypto";

import { notFound } from "next/navigation";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { ApiResponse } from "@/types/types";
import { Shift } from "@/types/shift/type";
import { getShift } from "@/lib/actions/shift-actions";
import ShiftForm from "@/components/forms/shift_form";

type Params = Promise<{ id: string }>;

export default async function ShiftPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: ApiResponse<Shift> | null = null;

  if (!isNewItem) {
    try {
      item = await getShift(resolvedParams.id as UUID);
      if (item.totalElements == 0) notFound();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to load shift data");
    }
  }

  const shift = item?.content[0];
  const titleLabel = isNewItem ? "Add shift" : `Edit ${shift?.name ?? "shift"}`;
  const subtitleLabel = isNewItem
    ? "Define a recurring shift template that staff can be scheduled into."
    : `Update the schedule and details for ${shift?.name ?? "this shift"}.`;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Shifts", href: "/shifts" },
          { title: isNewItem ? "New" : shift?.name || "Edit" },
        ]}
      />
      <PageHeader title={titleLabel} subtitle={subtitleLabel} />
      <PageBody>
        <ShiftForm item={shift} />
      </PageBody>
    </PageShell>
  );
}
