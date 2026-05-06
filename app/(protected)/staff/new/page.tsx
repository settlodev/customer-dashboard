import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StaffForm from "@/components/forms/staff_form";
import { fetchDepartmentsForCurrentLocation } from "@/lib/actions/department-actions";
import type { Department } from "@/types/department/type";

// Create page. The dashboard credentials and POS PIN can both be
// captured here when the corresponding access toggle is on, so a
// merchant can add and provision a teammate in a single round-trip.
// Granular access toggles after creation live on /staff/{id}.
export default async function NewStaffPage() {
  // Departments load server-side so the form mounts with a valid
  // `departmentId` already in defaultValues — without this, a fast
  // submit races the client fetch and Zod rejects the empty UUID.
  // When the merchant's package doesn't unlock multi-department, this
  // returns a single Main entry and the form auto-selects it.
  const departments: Department[] = await fetchDepartmentsForCurrentLocation(
    true,
  ).catch(() => []);
  const defaultDepartmentId =
    departments.find((d) => d.isDefault)?.id ??
    (departments.length === 1 ? departments[0].id : undefined);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Staff", href: "/staff" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add staff"
        subtitle="Create a person record. Turn on Dashboard / POS access to provision them in the same step."
      />
      <PageBody>
        <StaffForm
          item={null}
          departments={departments}
          defaultDepartmentId={defaultDepartmentId}
        />
      </PageBody>
    </PageShell>
  );
}
