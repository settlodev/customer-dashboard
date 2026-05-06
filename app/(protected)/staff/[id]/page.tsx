import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { getStaff, getStaffDetail } from "@/lib/actions/staff-actions";
import { Staff, StaffDetail } from "@/types/staff";
import { StaffDetailView } from "./staff-detail-view";
import { StaffDetailActions } from "./staff-detail-actions";

type Params = Promise<{ id: string }>;

export default async function StaffPage({ params }: { params: Params }) {
  const { id } = await params;

  if (id === "new") redirect("/staff/new");

  let staff: Staff | null = null;
  let detail: StaffDetail | null = null;

  try {
    // Try the enriched detail first — it bundles gamification, loyalty,
    // and attendance in one round-trip. If the detail endpoint isn't
    // available (e.g. permission, location not selected) we degrade to
    // the basic staff record so the page still renders the profile.
    try {
      detail = await getStaffDetail(id);
      staff = detail?.profile ?? null;
    } catch {
      staff = await getStaff(id);
    }
    if (!staff) notFound();
  } catch {
    throw new Error("Failed to load staff data");
  }

  const fullName = `${staff.firstName} ${staff.lastName}`;

  // Status pill — Active / Inactive / Owner badge appears separately.
  const statusLabel = staff.active ? "Active" : "Inactive";
  const statusClass = staff.active
    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  // Subtitle reads "Job · Department · Roles" — collapses dividers when
  // any segment is missing so we don't end up with stray bullets.
  const subtitleParts: string[] = [];
  if (staff.jobTitle) subtitleParts.push(staff.jobTitle);
  if (staff.departmentName) subtitleParts.push(staff.departmentName);
  if (staff.roles?.length) {
    const roleList = staff.roles
      .slice(0, 3)
      .map((r) => r.name)
      .join(", ");
    const more = staff.roles.length > 3 ? ` +${staff.roles.length - 3}` : "";
    subtitleParts.push(`${roleList}${more}`);
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Staff", href: "/staff" },
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
            {staff.owner && (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400">
                Owner
              </span>
            )}
          </span>
        }
        subtitle={
          subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/staff/${staff.id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <StaffDetailActions staff={staff} />
          </>
        }
      />

      <PageBody>
        <StaffDetailView staff={staff} detail={detail} />
      </PageBody>
    </PageShell>
  );
}
