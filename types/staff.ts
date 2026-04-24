import { Gender } from "@/types/enums";
import { boolean, nativeEnum, object, preprocess, string, array, date, RefinementCtx } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

// ---------------------------------------------------------------------------
// Nested info types returned inside StaffResponse
// ---------------------------------------------------------------------------

export interface DepartmentInfo {
  id: string;
  name: string;
  color: string;
}

export interface RoleInfo {
  id: string;
  name: string;
  scope: string;
}

// ---------------------------------------------------------------------------
// Staff (matches StaffResponse from Accounts Service)
// ---------------------------------------------------------------------------

export interface Staff {
  id: string;
  accountId: string;
  locationId: string;
  authId: string | null;
  identifier: string;
  fullName: string;
  firstName: string;
  lastName: string;
  active: boolean;
  dashboardAccess: boolean;
  posAccess: boolean;
  /** True when this staff record is the account owner. Backend blocks
   * deactivation and access revocation for the owner-staff. */
  owner: boolean;
  /** Whether the staff has a POS PIN set. Hash itself is never returned —
   * the paired device gets it via the internal staff-sync endpoint. */
  hasPin: boolean;
  /** Timestamp of the last PIN change, or null if no PIN has been set. */
  pinUpdatedAt: string | null;
  color: string | null;
  employeeNumber: string | null;
  gender: Gender;
  dateOfBirth: string | null;
  joiningDate: string | null;
  jobTitle: string | null;
  emergencyNumber: string | null;
  emergencyName: string | null;
  emergencyRelationship: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  nationalityId: string | null;
  nationalityName: string | null;
  departmentId: string;
  departmentName: string | null;
  departments: DepartmentInfo[];
  roles: RoleInfo[];
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Enriched staff (list view with gamification)
// ---------------------------------------------------------------------------

export interface StaffListEnriched {
  staff: Staff;
  gamificationSummary: {
    totalXp: number;
    currentLevel: number;
    levelName: string;
    badgeIcon: string;
    currentStreak: number;
    leaderboardRank: number;
    activeChallenges: Array<{
      challengeName: string;
      challengeType: string;
      currentValue: number;
      targetValue: number;
      completed: boolean;
      leading: boolean;
    }>;
  } | null;
  loyaltyPoints: number;
}

// ---------------------------------------------------------------------------
// Staff detail (single view with gamification, loyalty, attendance)
// ---------------------------------------------------------------------------

export interface StaffDetail {
  profile: Staff;
  gamification: {
    enabled: boolean;
    totalXp: number;
    currentLevel: number;
    levelName: string;
    badgeIcon: string;
    xpToNextLevel: number;
    currentStreak: number;
    longestStreak: number;
    leaderboardRank: number;
    ordersToday: number;
    activeChallenges: Array<{
      challengeId: string;
      challengeName: string;
      currentValue: number;
      targetValue: number;
      progressPercentage: number;
      completed: boolean;
      distanceMessage: string;
    }>;
    recentXpTransactions: StaffXpTransaction[];
  } | null;
  loyalty: {
    points: number;
    carryOver: number;
    redeemable: boolean;
    minimumRedeemablePoints: number;
  } | null;
  attendance: {
    recentSchedules: any[];
    recentTimesheetEntries: any[];
  } | null;
}

export interface StaffXpTransaction {
  id: string;
  staffId: string;
  xpAmount: number;
  xpSource: string;
  referenceType: string;
  referenceId: string;
  description: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Staff count
// ---------------------------------------------------------------------------

export interface StaffCount {
  total: number;
  active: number;
  inactive: number;
}

// ---------------------------------------------------------------------------
// Staff summary report (from Reports Service)
// ---------------------------------------------------------------------------

export interface StaffSummaryReport {
  staffReports: StaffReportItem[];
}

export interface StaffReportItem {
  id: string;
  name: string;
  image: string;
  totalOrdersCompleted: number;
  totalItemsSold: number;
  totalStockIntakePerformed: number;
  totalGrossAmount: number;
  totalNetAmount: number;
  totalGrossProfit: number;
}

// ---------------------------------------------------------------------------
// Schema for create/update staff form
// ---------------------------------------------------------------------------

export const StaffSchema = object({
  firstName: string({ required_error: "First name is required" }).min(1, "Enter a valid first name"),
  lastName: string({ required_error: "Last name is required" }).min(1, "Enter a valid last name"),
  phoneNumber: string().optional().nullable(),
  email: string().email("Enter a valid email").optional().nullable(),
  gender: nativeEnum(Gender, { required_error: "Gender is required" }),
  jobTitle: string({ required_error: "Job title is required" }).min(1, "Enter a job title"),
  departmentId: string({ required_error: "Department is required" }).uuid("Select a department"),
  departmentIds: array(string().uuid()).optional(),
  roleIds: array(string().uuid()).optional(),
  color: preprocess((val) => (val === null || val === "" ? undefined : val), string().optional()),
  employeeNumber: preprocess((val) => (val === null || val === "" ? undefined : val), string().optional()),
  dateOfBirth: preprocess((val) => {
    if (!val || val === "") return undefined;
    if (typeof val === "string") return new Date(val);
    return val;
  }, date().optional()),
  joiningDate: preprocess((val) => {
    if (!val || val === "") return undefined;
    if (typeof val === "string") return new Date(val);
    return val;
  }, date().optional()),
  nationalityId: preprocess((val) => (val === null || val === "" ? undefined : val), string().uuid().optional()),
  address: preprocess((val) => (val === null || val === "" ? undefined : val), string().optional()),
  notes: preprocess((val) => (val === null || val === "" ? undefined : val), string().optional()),
  emergencyName: preprocess((val) => (val === null || val === "" ? undefined : val), string().optional()),
  emergencyNumber: preprocess((val) => (val === null || val === "" ? undefined : val), string().optional()),
  emergencyRelationship: preprocess((val) => (val === null || val === "" ? undefined : val), string().optional()),
  posAccess: boolean().optional(),
  dashboardAccess: boolean().optional(),
  pin: preprocess((val) => (val === null || val === "" ? undefined : val), string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits").optional()),
  password: preprocess((val) => (val === null || val === "" ? undefined : val), string().min(8, "Password must be at least 8 characters").optional()),
}).superRefine((data, ctx: RefinementCtx) => {
  if (data.dashboardAccess) {
    if (!data.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Email is required for dashboard access" });
    }
    if (!data.password) {
      ctx.addIssue({ code: "custom", path: ["password"], message: "Password is required for dashboard access" });
    }
  }
});
