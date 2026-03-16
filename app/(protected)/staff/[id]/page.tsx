import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import StaffForm from "@/components/forms/staff_form";
import { getStaff } from "@/lib/actions/staff-actions";
import { Staff } from "@/types/staff";
import { ApiResponse } from "@/types/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Building2,
  User,
  MapPin,
  Shield,
  Star,
  FileText,
  Users,
} from "lucide-react";

type Params = Promise<{ id: string }>;

export default async function StaffPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";

  if (isNewItem) {
    const breadcrumbItems = [
      { title: "Staff", link: "/staff" },
      { title: "New", link: "" },
    ];
    return (
      <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
        <div className="space-y-6">
          <div>
            <div className="hidden sm:block mb-2">
              <BreadcrumbsNav items={breadcrumbItems} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Add Staff
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Add a new staff member to your business
            </p>
          </div>
          <StaffForm item={null} />
        </div>
      </div>
    );
  }

  let item: ApiResponse<Staff> | null = null;

  try {
    item = await getStaff(resolvedParams.id as UUID);
    if (item.totalElements === 0) notFound();
  } catch (error) {
    console.log(error);
    throw new Error("Failed to load staff data");
  }

  const staff = item.content[0];

  const breadcrumbItems = [
    { title: "Staff", link: "/staff" },
    { title: `${staff.firstName} ${staff.lastName}`, link: "" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <Link href={`/staff/${staff.id}/edit`}>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Staff
          </Button>
        </Link>
      </div>

      {/* Name & Status */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {staff.firstName} {staff.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {staff.jobTitle}
            {staff.employeeNumber && (
              <span className="font-mono ml-2">({staff.employeeNumber})</span>
            )}
          </p>
        </div>
        <Badge
          variant={staff.status ? "default" : "secondary"}
          className={
            staff.status
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              : ""
          }
        >
          {staff.status ? "Active" : "Inactive"}
        </Badge>
        {staff.isArchived && (
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            Archived
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Loyalty Points"
          value={staff.loyaltyPoints?.toLocaleString() ?? "0"}
          icon={Star}
        />
        <SummaryCard
          label="Department"
          value={staff.departmentName ?? "—"}
          icon={Building2}
        />
        <SummaryCard
          label="Role"
          value={staff.roleName ?? "—"}
          icon={Shield}
        />
        {staff.salaryAmount != null && (
          <SummaryCard
            label="Salary"
            value={staff.salaryAmount.toLocaleString()}
            icon={Briefcase}
          />
        )}
      </div>

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

        {/* System Access */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              System Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">POS Access</span>
              <Badge
                variant={staff.posAccess ? "default" : "secondary"}
                className={
                  staff.posAccess
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                    : ""
                }
              >
                {staff.posAccess ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">
                Dashboard Access
              </span>
              <Badge
                variant={staff.dashboardAccess ? "default" : "secondary"}
                className={
                  staff.dashboardAccess
                    ? "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                    : ""
                }
              >
                {staff.dashboardAccess ? "Enabled" : "Disabled"}
              </Badge>
            </div>
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
