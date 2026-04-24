import { notFound, redirect } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStaff, getStaffDetail } from "@/lib/actions/staff-actions";
import { Staff, StaffDetail } from "@/types/staff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Zap,
  Trophy,
  Flame,
  Target,
} from "lucide-react";
import StaffDetailDashboard from "@/components/dashboard/StaffDetailDashboard";

type Params = Promise<{ id: string }>;

export default async function StaffPage({ params }: { params: Params }) {
  const resolvedParams = await params;

  if (resolvedParams.id === "new") {
    redirect("/staff/new/edit");
  }

  let staff: Staff | null = null;
  let detail: StaffDetail | null = null;

  try {
    // Try enriched detail first, fall back to basic
    try {
      detail = await getStaffDetail(resolvedParams.id);
      staff = detail?.profile ?? null;
    } catch {
      staff = await getStaff(resolvedParams.id);
    }
    if (!staff) notFound();
  } catch {
    throw new Error("Failed to load staff data");
  }

  const breadcrumbItems = [
    { title: "Staff", link: "/staff" },
    { title: `${staff.firstName} ${staff.lastName}`, link: "" },
  ];

  const roleNames = staff.roles?.map((r) => r.name).join(", ") || "—";
  const departmentNames = staff.departments?.length > 0
    ? staff.departments.map((d) => d.name).join(", ")
    : staff.departmentName || "—";

  const gamification = detail?.gamification;
  const loyalty = detail?.loyalty;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <BreadcrumbsNav items={breadcrumbItems} />

      <StaffDetailDashboard
        staffId={resolvedParams.id}
        staffName={`${staff.firstName} ${staff.lastName}`}
        jobTitle={staff.jobTitle ?? ""}
        status={staff.active}
        isArchived={!staff.active}
        posAccess={staff.posAccess}
        dashboardAccess={staff.dashboardAccess}
        owner={staff.owner}
        editUrl={`/staff/${staff.id}/edit`}
        loyaltyPoints={staff.loyaltyPoints}
        departmentName={departmentNames}
      />

      {/* Gamification & Loyalty Summary */}
      {gamification?.enabled && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Zap} label="Total XP" value={gamification.totalXp.toLocaleString()} />
          <StatCard icon={Trophy} label="Level" value={`${gamification.currentLevel} - ${gamification.levelName}`} />
          <StatCard icon={Flame} label="Streak" value={`${gamification.currentStreak} days`} />
          <StatCard icon={Target} label="Rank" value={`#${gamification.leaderboardRank}`} />
        </div>
      )}

      {/* Active Challenges */}
      {gamification?.enabled && gamification.activeChallenges?.length > 0 && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Active Challenges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gamification.activeChallenges.map((challenge) => (
                <div key={challenge.challengeId} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{challenge.challengeName}</span>
                    {challenge.completed && <Badge variant="secondary" className="text-xs">Done</Badge>}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(challenge.progressPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{challenge.distanceMessage}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            <DetailRow icon={Phone} label="Phone" value={staff.phoneNumber} />
            <DetailRow icon={Mail} label="Email" value={staff.email} />
            <DetailRow label="Gender" value={staff.gender} />
            <DetailRow
              icon={Calendar}
              label="Date of Birth"
              value={staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : null}
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
            <DetailRow icon={Building2} label="Department" value={departmentNames} />
            <DetailRow icon={Shield} label="Roles" value={roleNames} />
            <DetailRow
              icon={Calendar}
              label="Joining Date"
              value={staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString() : null}
            />
            {loyalty && (
              <DetailRow label="Loyalty Points" value={`${loyalty.points.toLocaleString()} pts`} />
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
              <DetailRow icon={Phone} label="Contact Phone" value={staff.emergencyNumber} />
              <DetailRow label="Relationship" value={staff.emergencyRelationship} />
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
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{staff.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
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
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value || "—"}</span>
    </div>
  );
}
