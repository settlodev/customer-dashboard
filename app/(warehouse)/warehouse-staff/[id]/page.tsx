import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getWarehouseStaffMember } from "@/lib/actions/warehouse/staff-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, User, Briefcase, Shield } from "lucide-react";

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const staff = await getWarehouseStaffMember(id);
  if (!staff) notFound();

  const roleNames = staff.roles?.map((r) => r.name).join(", ") || "—";
  const deptNames = staff.departments?.length > 0
    ? staff.departments.map((d) => d.name).join(", ")
    : staff.departmentName || "—";

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={[
        { title: "Warehouse Staff", link: "/warehouse-staff" },
        { title: `${staff.firstName} ${staff.lastName}`, link: "" },
      ]} />

      <div>
        <h1 className="text-2xl font-bold">{staff.firstName} {staff.lastName}</h1>
        <p className="text-sm text-muted-foreground">{staff.jobTitle || "Staff"} · {staff.active ? "Active" : "Inactive"}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" /> Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row icon={Phone} label="Phone" value={staff.phoneNumber} />
            <Row icon={Mail} label="Email" value={staff.email} />
            <Row label="Gender" value={staff.gender} />
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" /> Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Job Title" value={staff.jobTitle} />
            <Row label="Employee #" value={staff.employeeNumber} />
            <Row label="Department" value={deptNames} />
            <Row icon={Shield} label="Roles" value={roleNames} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value || "—"}</span>
    </div>
  );
}
