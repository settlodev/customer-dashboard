"use client";

import React, {
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  KeyRound,
  Mail,
  Palette,
  Phone as PhoneIcon,
  Shield,
  Sparkles,
  Trash2,
  User,
  Users,
  Briefcase,
  IdCard,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GenderSelector from "@/components/widgets/gender-selector";
import RoleSelector from "@/components/widgets/role-selector";
import CountrySelector from "@/components/widgets/country-selector";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogIcon,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import { Staff, StaffSchema } from "@/types/staff";
import type { Department } from "@/types/department/type";
import { FormResponse } from "@/types/types";
import { cn } from "@/lib/utils";
import { createStaff, updateStaff } from "@/lib/actions/staff-actions";

import { initialsFor, thumbColor } from "@/components/tables/shared/table-avatar";
import styles from "./styles/form-shell.module.css";

interface StaffFormProps {
  item: Staff | null | undefined;
  /**
   * Departments available at the current location. Server-fetched so the
   * form mounts with a valid `departmentId` already in defaultValues —
   * mirrors the category form pattern. When the merchant's package only
   * exposes the auto-created Main department (i.e. one entry), the
   * picker is hidden and that single department is auto-selected.
   */
  departments: Department[];
  /**
   * Department to pre-select. Defaults to the location's `isDefault`
   * department, or the only entry when departments has length 1. Pages
   * compute this server-side so the form mount is fully primed.
   */
  defaultDepartmentId?: string;
}

type StaffFormValues = z.infer<typeof StaffSchema>;

export default function StaffForm({
  item,
  departments,
  defaultDepartmentId,
}: StaffFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  // Single-department merchants (Main only — typical for accounts whose
  // package doesn't unlock the multi-department feature) skip the
  // picker entirely. The form just commits the auto-resolved id to the
  // departmentId field at submit time.
  const showDepartmentPicker = departments.length > 1;
  const today = useMemo(() => new Date(), []);
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [activeTab, setActiveTab] = useState<
    "personal" | "work" | "access" | "emergency"
  >("work");

  const isEditMode = !!item;

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(StaffSchema),
    defaultValues: {
      firstName: item?.firstName ?? "",
      lastName: item?.lastName ?? "",
      phoneNumber: item?.phoneNumber ?? "",
      email: item?.email ?? "",
      gender: item?.gender,
      jobTitle: item?.jobTitle ?? "",
      departmentId: item?.departmentId ?? defaultDepartmentId ?? "",
      departmentIds: item?.departments?.map((d) => d.id) ?? [],
      roleIds: item?.roles?.map((r) => r.id) ?? [],
      color: item?.color ?? "",
      employeeNumber: item?.employeeNumber ?? "",
      dateOfBirth: item?.dateOfBirth ? new Date(item.dateOfBirth) : undefined,
      joiningDate: item?.joiningDate ? new Date(item.joiningDate) : undefined,
      nationalityId: item?.nationalityId ?? "",
      address: item?.address ?? "",
      notes: item?.notes ?? "",
      emergencyName: item?.emergencyName ?? "",
      emergencyNumber: item?.emergencyNumber ?? "",
      emergencyRelationship: item?.emergencyRelationship ?? "",
      posAccess: item?.posAccess ?? false,
      dashboardAccess: item?.dashboardAccess ?? false,
      pin: "",
      password: "",
      referredByCode: "",
    },
  });

  // Watched values feed both the live preview card and the per-section
  // completion checklist. Keep this list lean — every entry is a
  // re-render trigger.
  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");
  const jobTitle = form.watch("jobTitle");
  const departmentId = form.watch("departmentId");
  const gender = form.watch("gender");
  const dashboardAccess = form.watch("dashboardAccess");
  const posAccess = form.watch("posAccess");
  const email = form.watch("email");
  const password = form.watch("password");
  const color = form.watch("color");
  const roleIds = form.watch("roleIds") ?? [];

  const fullName = useMemo(
    () => `${firstName ?? ""} ${lastName ?? ""}`.trim(),
    [firstName, lastName],
  );

  // Required-field checklist. Mirrors what the Zod schema enforces
  // server-side so the readiness bar can't lie. When `dashboardAccess`
  // is on, email + password become required (the schema also enforces
  // this via superRefine).
  const requiredFlags = useMemo(() => {
    const baseRequired = [
      !!firstName?.trim(),
      !!lastName?.trim(),
      !!jobTitle?.trim(),
      !!departmentId,
      !!gender,
      roleIds.length > 0,
    ];
    if (!isEditMode && dashboardAccess) {
      baseRequired.push(!!email?.trim(), (password?.length ?? 0) >= 8);
    }
    return baseRequired;
  }, [
    firstName,
    lastName,
    jobTitle,
    departmentId,
    gender,
    roleIds,
    isEditMode,
    dashboardAccess,
    email,
    password,
  ]);
  const completion = Math.round(
    (requiredFlags.filter(Boolean).length / requiredFlags.length) * 100,
  );
  const isValid = requiredFlags.every(Boolean);
  const remainingFields = requiredFlags.filter((v) => !v).length;

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      const firstError =
        Object.values(errors)[0]?.message ??
        "Please check the highlighted fields and try again.";
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description: typeof firstError === "string" ? firstError : undefined,
      });
    },
    [toast],
  );

  const submit = useCallback(
    (values: StaffFormValues) => {
      setResponse(undefined);
      startTransition(async () => {
        try {
          const result = isEditMode
            ? await updateStaff(item!.id, values)
            : await createStaff(values);
          if (!result) return;
          setResponse(result);
          if (result.responseType === "success") {
            toast({
              variant: "success",
              title: isEditMode ? "Staff updated" : "Staff created",
              description: result.message,
            });
            router.push("/staff");
          } else {
            toast({
              variant: "destructive",
              title: "Couldn't save staff",
              description: result.message,
            });
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Something went wrong",
            description:
              (error as Error)?.message ?? "Please try again later.",
          });
        }
      });
    },
    [isEditMode, item, router, toast],
  );

  const handleDiscard = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <Form {...form}>
      {response?.responseType === "error" && response?.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t save this staff member</AlertTitle>
            <AlertDescription>{response.message}</AlertDescription>
          </AlertBody>
        </Alert>
      ) : null}

      <form
        onSubmit={form.handleSubmit(submit, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formGrid}>
          {/* ── LEFT — form column ─────────────────────────────── */}
          <div className={styles.formStack}>
            {/* Identity card */}
            <section className={styles.formCard}>
              <header className={styles.formCardHead}>
                <div className={styles.icoBox}>
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3>Identity</h3>
                  <p className={styles.formCardHeadDesc}>
                    The basics shown across the dashboard and POS.
                  </p>
                </div>
                <div className={styles.formCardActions}>
                  <span className={styles.stepBadge}>STEP 01</span>
                </div>
              </header>

              <div className={styles.formBody}>
                <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          First name <span className="req">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Amani"
                            disabled={isPending}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Last name <span className="req">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Mushi"
                            disabled={isPending}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Gender <span className="req">*</span>
                        </FormLabel>
                        <FormControl>
                          <GenderSelector
                            {...field}
                            isDisabled={isPending}
                            label="Select gender"
                            placeholder="Select gender"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Phone number
                        </FormLabel>
                        <FormControl>
                          <PhoneInput
                            placeholder="Enter phone number"
                            disabled={isPending}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nationalityId"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Nationality
                        </FormLabel>
                        <FormControl>
                          <CountrySelector
                            {...field}
                            isDisabled={isPending}
                            label="Select nationality"
                            placeholder="Select nationality"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          <span className="inline-flex items-center gap-1">
                            <Palette className="h-3 w-3" /> Tag colour
                          </span>
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2 rounded-md border border-line bg-card px-2 py-1.5">
                            <Input
                              type="color"
                              {...field}
                              value={field.value ?? "#0E8B5F"}
                              disabled={isPending}
                              className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                            />
                            <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                              {field.value || "default"}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Tabs section */}
            <section className={styles.formCard}>
              <div className={styles.formTabs} role="tablist">
                {(
                  [
                    {
                      id: "work",
                      label: "Work",
                      icon: <Briefcase className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "personal",
                      label: "Personal",
                      icon: <User className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "access",
                      label: "Access & PIN",
                      icon: <Shield className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "emergency",
                      label: "Emergency",
                      icon: <Users className="h-3.5 w-3.5" />,
                    },
                  ] as const
                )
                  .filter((t) => t.id !== "access" || !isEditMode)
                  .map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      role="tab"
                      aria-selected={activeTab === t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`${styles.formTab} ${
                        activeTab === t.id ? styles.formTabOn : ""
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
              </div>

              {/* Personal — DOB, address, notes */}
              {activeTab === "personal" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Personal details</h3>
                      <p className={styles.formCardHeadDesc}>
                        Birth date, residence and any notes about this person.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => {
                          const selected = field.value
                            ? new Date(field.value)
                            : undefined;
                          return (
                            <FormItem>
                              <FormLabel className={styles.fieldLabel}>
                                Date of birth
                              </FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      disabled={isPending}
                                      className={cn(
                                        "h-10 w-full justify-start text-left font-normal",
                                        !selected && "text-muted-foreground",
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                      {selected
                                        ? format(selected, "PPP")
                                        : "Pick a date"}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[300px] p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={selected}
                                    onSelect={(d) => field.onChange(d)}
                                    // Backend has @Past — disallow today
                                    // and any future date so the request
                                    // round-trips cleanly.
                                    disabled={(date) => date >= today}
                                    captionLayout="dropdown"
                                    fromYear={1900}
                                    toYear={today.getFullYear()}
                                    defaultMonth={selected ?? undefined}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Street, city or area"
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div
                      className={styles.fieldRow}
                      style={
                        {
                          ["--cols" as never]: 1,
                          marginTop: 14,
                        } as React.CSSProperties
                      }
                    >
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Notes
                              <span className="opt">
                                {(field.value ?? "").length}/1000
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Anything teammates should know — allergies, training notes, etc."
                                rows={4}
                                maxLength={1000}
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Work */}
              {activeTab === "work" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <Briefcase className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Work details</h3>
                      <p className={styles.formCardHeadDesc}>
                        Job title, department, and the roles that grant
                        permissions inside the dashboard and POS.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Job title <span className="req">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Cashier, Barista"
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="employeeNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Employee #
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="EMP-001"
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="joiningDate"
                        render={({ field }) => {
                          const selected = field.value
                            ? new Date(field.value)
                            : undefined;
                          return (
                            <FormItem>
                              <FormLabel className={styles.fieldLabel}>
                                Joining date
                              </FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      disabled={isPending}
                                      className={cn(
                                        "h-10 w-full justify-start text-left font-normal",
                                        !selected && "text-muted-foreground",
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                      {selected
                                        ? format(selected, "PPP")
                                        : "Pick a date"}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[300px] p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={selected}
                                    onSelect={(d) => field.onChange(d)}
                                    captionLayout="dropdown"
                                    fromYear={1990}
                                    toYear={today.getFullYear() + 1}
                                    defaultMonth={selected ?? today}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    {showDepartmentPicker ? (
                      <div
                        className={styles.fieldRow}
                        style={
                          {
                            ["--cols" as never]: 1,
                            marginTop: 14,
                          } as React.CSSProperties
                        }
                      >
                        <FormField
                          control={form.control}
                          name="departmentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={styles.fieldLabel}>
                                Primary department{" "}
                                <span className="req">*</span>
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value ?? ""}
                                disabled={isPending}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select primary department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {departments.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                      {d.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      // Hidden when the merchant's package only exposes
                      // the auto-created Main department. The hidden
                      // input keeps the field in the form state so the
                      // submit handler still POSTs the resolved id.
                      <input
                        type="hidden"
                        {...form.register("departmentId")}
                        value={form.watch("departmentId") ?? ""}
                      />
                    )}

                    <div
                      className={styles.fieldRow}
                      style={
                        {
                          ["--cols" as never]: 1,
                          marginTop: 14,
                        } as React.CSSProperties
                      }
                    >
                      <FormField
                        control={form.control}
                        name="roleIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Roles <span className="req">*</span>
                              <span className="opt">
                                {(field.value ?? []).length} SELECTED
                              </span>
                            </FormLabel>
                            <FormControl>
                              <RoleSelector
                                value={field.value ?? []}
                                onChange={field.onChange}
                                isDisabled={isPending}
                                placeholder="Pick at least one role"
                                multiple
                              />
                            </FormControl>
                            <p className={styles.fieldHint}>
                              At least one role is required — roles control
                              what this person can do in the dashboard and on
                              the POS.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {!isEditMode && (
                      <div
                        className={styles.fieldRow}
                        style={
                          {
                            ["--cols" as never]: 1,
                            marginTop: 14,
                          } as React.CSSProperties
                        }
                      >
                        <FormField
                          control={form.control}
                          name="referredByCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={styles.fieldLabel}>
                                Referral code
                                <span className="opt">OPTIONAL</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Code from the referring teammate"
                                  maxLength={16}
                                  disabled={isPending}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Access & PIN — create mode only; edit mode manages access from the detail page */}
              {activeTab === "access" && !isEditMode && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <Shield className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Access &amp; PIN</h3>
                      <p className={styles.formCardHeadDesc}>
                        Decide whether this person can sign into the dashboard
                        or the POS the moment they&apos;re created.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="dashboardAccess"
                            render={({ field }) => (
                              <FormItem className={styles.toggleRow}>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">
                                    Dashboard access
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Sign in at admin.settlo.co.tz to manage
                                    products, reports and settings.
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={!!field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isPending}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="posAccess"
                            render={({ field }) => (
                              <FormItem className={styles.toggleRow}>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">
                                    POS access
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Staff will be required to set their PIN
                                    when they start using their account.
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={!!field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isPending}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {dashboardAccess && (
                          <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-primary" />
                              <span className="text-[12.5px] font-medium text-ink">
                                Dashboard credentials
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={styles.fieldLabel}>
                                      Login email{" "}
                                      <span className="req">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="email"
                                        placeholder="staff@example.com"
                                        disabled={isPending}
                                        {...field}
                                        value={field.value ?? ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={styles.fieldLabel}>
                                      Initial password{" "}
                                      <span className="req">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        disabled={isPending}
                                        {...field}
                                        value={field.value ?? ""}
                                      />
                                    </FormControl>
                                    <p className={styles.fieldHint}>
                                      Share this password directly. The staff
                                      member can rotate it after first login.
                                    </p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}

                    </div>
                  </div>
                </>
              )}

              {/* Emergency contact */}
              {activeTab === "emergency" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Emergency contact</h3>
                      <p className={styles.formCardHeadDesc}>
                        Optional — surfaces in HR exports and on the staff
                        detail screen for managers to act on.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="emergencyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Contact name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Maria Mushi"
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emergencyNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Contact phone
                            </FormLabel>
                            <FormControl>
                              <PhoneInput
                                placeholder="Enter contact number"
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emergencyRelationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Relationship
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Spouse, Parent"
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* ── RIGHT — preview + readiness ───────────────────── */}
          <aside className={styles.formStack}>
            <LivePreviewCard
              fullName={fullName || "New staff"}
              jobTitle={jobTitle || "—"}
              color={color || undefined}
              gender={gender}
              dashboardAccess={!!dashboardAccess}
              posAccess={!!posAccess}
              roleCount={roleIds.length}
              checklist={[
                { label: "First name", done: requiredFlags[0] },
                { label: "Last name", done: requiredFlags[1] },
                { label: "Job title", done: requiredFlags[2] },
                ...(showDepartmentPicker
                  ? [{ label: "Department", done: requiredFlags[3] }]
                  : []),
                { label: "Gender", done: requiredFlags[4] },
                { label: "At least one role", done: requiredFlags[5] },
                ...(!isEditMode && dashboardAccess
                  ? [
                      { label: "Login email", done: requiredFlags[6] },
                      { label: "Initial password", done: requiredFlags[7] },
                    ]
                  : []),
              ]}
              completion={completion}
            />

            <TipsCard isEdit={isEditMode} />
          </aside>
        </div>

        {/* Sticky footer */}
        <div className={styles.formFoot}>
          <div className={styles.formFootSpacer} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                title="Discard changes and go back"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent tone="danger">
              <AlertDialogIcon>
                <Trash2 className="h-5 w-5" />
              </AlertDialogIcon>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anything you typed since opening the form will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={handleDiscard}>
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            type="submit"
            disabled={isPending || !isValid}
            title={
              isValid
                ? isEditMode
                  ? "Save changes"
                  : "Create staff"
                : `Complete required fields (${remainingFields} remaining)`
            }
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {isEditMode ? "Save changes" : "Create staff"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Right-rail: live preview card mirroring the products live preview
// ─────────────────────────────────────────────────────────────────────

interface LivePreviewProps {
  fullName: string;
  jobTitle: string;
  color: string | undefined;
  gender: string | undefined;
  dashboardAccess: boolean;
  posAccess: boolean;
  roleCount: number;
  checklist: Array<{ label: string; done: boolean }>;
  completion: number;
}

function LivePreviewCard({
  fullName,
  jobTitle,
  color,
  gender,
  dashboardAccess,
  posAccess,
  roleCount,
  checklist,
  completion,
}: LivePreviewProps) {
  const initials = initialsFor(fullName || "?");
  const swatch = color || thumbColor(fullName);

  return (
    <div className={styles.previewCard}>
      <div className={styles.previewHead}>
        <span className={styles.liveDot} />
        Live preview
      </div>
      <div className={styles.previewBody}>
        <div
          className={styles.previewThumb}
          style={{
            background: `linear-gradient(135deg, ${swatch}, ${swatch}cc)`,
          }}
        >
          {initials}
        </div>
        <div className={styles.previewName}>{fullName}</div>
        <div className={styles.previewMeta}>
          {jobTitle}
          {gender ? ` · ${gender}` : ""}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {dashboardAccess && (
            <Badge variant="soft" className="text-[10.5px]">
              Dashboard
            </Badge>
          )}
          {posAccess && (
            <Badge variant="pos" className="text-[10.5px]">
              POS
            </Badge>
          )}
          {roleCount > 0 && (
            <Badge variant="soft" className="text-[10.5px]">
              {roleCount} {roleCount === 1 ? "role" : "roles"}
            </Badge>
          )}
          {!dashboardAccess && !posAccess && (
            <Badge variant="warn" className="text-[10.5px]">
              No access
            </Badge>
          )}
        </div>

        <div className={styles.checklist}>
          {checklist.map((c) => (
            <div
              key={c.label}
              className={`${styles.checklistItem} ${
                c.done ? styles.checklistItemDone : ""
              }`}
            >
              <span className={styles.checklistMark}>
                {c.done ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
              </span>
              {c.label}
            </div>
          ))}
        </div>

        <div className={styles.readiness}>
          <div className={styles.readinessHead}>
            <span className={styles.readinessLabel}>Readiness</span>
            <span
              className={`${styles.readinessPct} ${
                completion === 100 ? styles.readinessPctDone : ""
              }`}
            >
              {completion}%
            </span>
          </div>
          <div className={styles.readinessBar}>
            <div
              className={`${styles.readinessBarFill} ${
                completion === 100 ? styles.readinessBarFillDone : ""
              }`}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Right-rail: contextual tips card
// ─────────────────────────────────────────────────────────────────────

function TipsCard({ isEdit }: { isEdit: boolean }) {
  const tips = isEdit
    ? [
        {
          icon: ShieldCheck,
          text: "Granular access (POS / dashboard / PIN) lives on the detail page menu — out of this form's way.",
        },
        {
          icon: IdCard,
          text: "Employee numbers must be unique within your account.",
        },
        {
          icon: Smartphone,
          text: "Paired POS devices pick up profile changes on their next sync.",
        },
      ]
    : [
        {
          icon: Sparkles,
          text: "You need first name, last name, gender, job title, a department, and at least one role to create someone.",
        },
        {
          icon: Shield,
          text: "Turn on Dashboard access if this person needs to log in at admin.settlo.co.tz.",
        },
        {
          icon: KeyRound,
          text: "Turn on POS access for cashiers; the PIN can be set now or later from the detail page.",
        },
        {
          icon: PhoneIcon,
          text: "Phone, address, and emergency contact are optional but help during incidents.",
        },
      ];

  return (
    <div className={styles.previewCard}>
      <div className={styles.previewHead}>Tips</div>
      <div className="space-y-2.5 px-4 py-4">
        {tips.map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-2 text-[12px] text-ink-3">
            <Icon className="h-3.5 w-3.5 flex-shrink-0 text-primary mt-0.5" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
