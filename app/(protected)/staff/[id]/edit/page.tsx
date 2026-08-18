import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StaffForm from "@/components/forms/staff_form";
import { getStaff } from "@/lib/actions/staff-actions";
import { fetchDepartmentsForCurrentLocation } from "@/lib/actions/department-actions";
import { Staff } from "@/types/staff";
import type { Department } from "@/types/department/type";

type Params = Promise<{ id: string }>;

export default async function StaffEditPage({ params }: { params: Params }) {
  const { id } = await params;

  // /staff/new is now a sibling route — bounce there if someone hits
  // the edit URL with a literal "new" id.
  if (id === "new") redirect("/staff/new");

  let staff: Staff | null = null;
  try {
    staff = await getStaff(id);
    if (!staff) notFound();
  } catch {
    throw new Error("Failed to load staff data");
  }

  const departments: Department[] = await fetchDepartmentsForCurrentLocation(
    true,
  ).catch(() => []);
  const defaultDepartmentId =
    departments.find((d) => d.isDefault)?.id ??
    (departments.length === 1 ? departments[0].id : undefined);

  const fullName = `${staff.firstName} ${staff.lastName}`;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Staff", href: "/staff" },
          { title: fullName, href: `/staff/${staff.id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title={`Edit ${fullName}`}
        subtitle="Update profile details. Manage POS / dashboard access from the detail page menu."
      />
      {!staff.active && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
          This staff member is <strong>deactivated</strong>. Profile edits are saved,
          but they have no dashboard or POS access until reactivated from the{" "}
          <Link href={`/staff/${staff.id}`} className="underline">
            staff detail page
          </Link>
          .
        </div>
      )}
      <PageBody>
        <StaffForm
          item={staff}
          departments={departments}
          defaultDepartmentId={defaultDepartmentId}
        />
      </PageBody>
    </PageShell>
  );
}
