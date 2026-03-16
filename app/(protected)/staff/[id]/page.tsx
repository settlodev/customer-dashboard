import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import StaffForm from "@/components/forms/staff_form";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStaff } from "@/lib/actions/staff-actions";
import { Staff } from "@/types/staff";
import { ApiResponse } from "@/types/types";

type Params = Promise<{ id: string }>;
export default async function StaffPage({
  params,
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: ApiResponse<Staff> | null = null;

  if (!isNewItem) {
    try {
      item = await getStaff(resolvedParams.id as UUID);
      if (item.totalElements == 0) notFound();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to load staff data");
    }
  }

  const breadcrumbItems = [
    { title: "Staff", link: "/staff" },
    {
      title: isNewItem
        ? "New"
        : item?.content[0]?.firstName || "Edit",
      link: "",
    },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isNewItem ? "Add Staff" : "Edit Staff"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isNewItem
              ? "Add a new staff member to your business"
              : "Update staff details and permissions"}
          </p>
        </div>

        <StaffForm item={isNewItem ? null : item?.content[0]} />
      </div>
    </div>
  );
}
