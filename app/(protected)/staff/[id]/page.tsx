import { UUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStaff } from "@/lib/actions/staff-actions";
import { Staff } from "@/types/staff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Building2,
  User,
  MapPin,
  Shield,
  FileText,
  Users,
} from "lucide-react";
import StaffDetailDashboard from "@/components/dashboard/StaffDetailDashboard";

type Params = Promise<{ id: string }>;

export default async function StaffPage({ params }: { params: Params }) {
  const resolvedParams = await params;

  if (resolvedParams.id === "new") {
    redirect("/staff/new/edit");
  }

  let staff: Staff | null = null;

  try {
    staff = await getStaff(resolvedParams.id as UUID);
    if (!staff) notFound();
  } catch (error) {
    console.log(error);
    throw new Error("Failed to load staff data");
  }

  const breadcrumbItems = [
    { title: "Staff", link: "/staff" },
    { title: `${staff.firstName} ${staff.lastName}`, link: "" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Breadcrumbs */}
      <BreadcrumbsNav items={breadcrumbItems} />

      {/* Sales Report Summary */}
      <StaffDetailDashboard
        staffId={resolvedParams.id}
        staffName={`${staff.firstName} ${staff.lastName}`}
        jobTitle={staff.jobTitle}
        status={staff.status}
        isArchived={staff.isArchived}
        posAccess={staff.posAccess}
        dashboardAccess={staff.dashboardAccess}
        editUrl={`/staff/${staff.id}/edit`}
        loyaltyPoints={staff.loyaltyPoints}
        departmentName={staff.departmentName}
      >
        {/* Summary Cards — rendered after revenue stream */}
        {staff.salaryAmount != null && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SummaryCard
              label="Salary"
              value={staff.salaryAmount.toLocaleString()}
              icon={Briefcase}
            />
          </div>
        )}
      </StaffDetailDashboard>

      {/* Detail Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow icon={Phone} label="Phone" value={staff.phone} />
            <DetailRow icon={Mail} label="Email" value={staff.email} />
            <DetailRow label="Gender" value={staff.gender} />
            <DetailRow
              icon={Calendar}
              label="Date of Birth"
              value={
                staff.dateOfBirth
                  ? new Date(staff.dateOfBirth).toLocaleDateString()
                  : null
              }
            />
            <DetailRow label="Nationality" value={staff.nationalityName} />
            <DetailRow icon={MapPin} label="Address" value={staff.address} />
          </CardContent>
        </Card>

        {/* Work Details */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Work Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Job Title" value={staff.jobTitle} />
            <DetailRow label="Employee Number" value={staff.employeeNumber} />
            <DetailRow icon={Building2} label="Department" value={staff.departmentName} />
            <DetailRow icon={Shield} label="Role" value={staff.roleName} />
            <DetailRow
              icon={Calendar}
              label="Joining Date"
              value={
                staff.joiningDate
                  ? new Date(staff.joiningDate).toLocaleDateString()
                  : null
              }
            />
            {staff.salaryAmount != null && (
              <DetailRow
                label="Salary"
                value={staff.salaryAmount.toLocaleString()}
              />
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        {(staff.emergencyName || staff.emergencyNumber) && (
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Contact Name" value={staff.emergencyName} />
              <DetailRow
                icon={Phone}
                label="Contact Phone"
                value={staff.emergencyNumber}
              />
              <DetailRow
                label="Relationship"
                value={staff.emergencyRelationship}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      {staff.notes && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {staff.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-500" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {value || "—"}
      </span>
    </div>
  );
}
