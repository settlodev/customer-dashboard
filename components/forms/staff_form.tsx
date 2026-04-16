"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createStaff,
  updateStaff,
  grantDashboardAccess,
  revokeDashboardAccess,
  grantPosAccess,
  revokePosAccess,
  resetStaffPasscode,
} from "@/lib/actions/staff-actions";
import { Staff, StaffSchema } from "@/types/staff";
import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import GenderSelector from "@/components/widgets/gender-selector";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "../ui/phone-input";
import { Switch } from "../ui/switch";
import DepartmentSelector from "@/components/widgets/department-selector";
import RoleSelector from "@/components/widgets/role-selector";
import CountrySelector from "@/components/widgets/country-selector";
import { Separator } from "../ui/separator";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { FormError } from "../widgets/form-error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface StaffFormProps {
  item: Staff | null | undefined;
  onFormSubmitted?: (response: FormResponse) => void;
}

const StaffForm: React.FC<StaffFormProps> = ({ item, onFormSubmitted }) => {
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [isDashboardEnabled, setIsDashboardEnabled] = useState(item?.dashboardAccess ?? false);
  const [isPosEnabled, setIsPosEnabled] = useState(item?.posAccess ?? false);
  const [accessLoading, setAccessLoading] = useState<string | null>(null);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [dashboardEmail, setDashboardEmail] = useState("");
  const [dashboardPassword, setDashboardPassword] = useState("");
  const router = useRouter();

  const form = useForm<z.infer<typeof StaffSchema>>({
    resolver: zodResolver(StaffSchema),
    defaultValues: {
      firstName: item?.firstName ?? "",
      lastName: item?.lastName ?? "",
      phoneNumber: item?.phoneNumber ?? "",
      email: item?.email ?? "",
      gender: item?.gender,
      jobTitle: item?.jobTitle ?? "",
      departmentId: item?.departmentId ?? "",
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
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description:
          typeof errors.message === "string" && errors.message
            ? errors.message
            : "Please check your inputs and try again.",
      });
    },
    [toast],
  );

  const submitData = async (values: z.infer<typeof StaffSchema>) => {
    setResponse(undefined);
    startTransition(async () => {
      try {
        let result: FormResponse | void;
        if (item) {
          result = await updateStaff(item.id, values);
        } else {
          result = await createStaff(values);
        }
        if (result) {
          setResponse(result);
          if (result.responseType === "success") {
            toast({ variant: "success", title: "Success", description: result.message });
            onFormSubmitted?.(result);
            router.push("/staff");
          } else if (result.responseType === "error") {
            toast({ variant: "destructive", title: "Error", description: result.message });
          }
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: error?.message || "Please try again later",
        });
      }
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">

        {/* Basic Information */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInput placeholder="Enter phone number" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <GenderSelector {...field} isDisabled={isSubmitting} label="Select gender" placeholder="Select gender" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationalityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <CountrySelector {...field} isDisabled={isSubmitting} label="Select nationality" placeholder="Select nationality" />
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
                      <FormLabel>Employee Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. EMP-001" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Work Details */}
            <div>
              <h3 className="text-lg font-medium mb-4">Work Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter job title" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <DepartmentSelector {...field} isDisabled={isSubmitting} placeholder="Select department" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roleIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roles</FormLabel>
                      <FormControl>
                        <RoleSelector
                          value={field.value ?? []}
                          onChange={field.onChange}
                          isDisabled={isSubmitting}
                          placeholder="Select roles"
                          multiple
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
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} value={field.value ?? "#000000"} disabled={isSubmitting} className="h-9 w-20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* System Access */}
            <div>
              <h3 className="text-lg font-medium mb-4">System Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!item && (
                  <>
                    <FormField
                      control={form.control}
                      name="dashboardAccess"
                      render={({ field }) => (
                        <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium cursor-pointer">Dashboard Access</FormLabel>
                            <p className="text-xs text-muted-foreground">Allow access to admin dashboard</p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => { field.onChange(checked); setIsDashboardEnabled(checked); }}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="posAccess"
                      render={({ field }) => (
                        <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium cursor-pointer">POS Access</FormLabel>
                            <p className="text-xs text-muted-foreground">Allow access to POS system</p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => { field.onChange(checked); setIsPosEnabled(checked); }}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {item && (
                  <div className="col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <span className="text-sm font-medium">Dashboard Access</span>
                          <p className="text-xs text-muted-foreground">
                            {item.dashboardAccess ? "Staff can log into the dashboard" : "No dashboard access"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={item.dashboardAccess ? "destructive" : "default"}
                          disabled={accessLoading !== null}
                          onClick={async () => {
                            setAccessLoading("dashboard");
                            try {
                              if (item.dashboardAccess) {
                                const r = await revokeDashboardAccess(item.id);
                                toast({ variant: r.responseType === "success" ? "success" : "destructive", title: r.message });
                              } else {
                                setShowDashboardModal(true);
                              }
                            } finally { setAccessLoading(null); }
                          }}
                        >
                          {accessLoading === "dashboard" ? "..." : item.dashboardAccess ? "Revoke" : "Grant"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <span className="text-sm font-medium">POS Access</span>
                          <p className="text-xs text-muted-foreground">
                            {item.posAccess ? "Staff can use POS devices" : "No POS access"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={item.posAccess ? "destructive" : "default"}
                          disabled={accessLoading !== null}
                          onClick={async () => {
                            setAccessLoading("pos");
                            try {
                              const r = item.posAccess
                                ? await revokePosAccess(item.id)
                                : await grantPosAccess(item.id);
                              toast({ variant: r.responseType === "success" ? "success" : "destructive", title: r.message });
                            } finally { setAccessLoading(null); }
                          }}
                        >
                          {accessLoading === "pos" ? "..." : item.posAccess ? "Revoke" : "Grant"}
                        </Button>
                      </div>
                    </div>

                    {item.posAccess && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={accessLoading !== null}
                        onClick={async () => {
                          setAccessLoading("pin");
                          try {
                            await resetStaffPasscode(item.id);
                            toast({ variant: "success", title: "PIN reset successfully" });
                          } catch (e: any) {
                            toast({ variant: "destructive", title: e?.message || "Failed to reset PIN" });
                          } finally { setAccessLoading(null); }
                        }}
                      >
                        {accessLoading === "pin" ? "Resetting..." : "Reset POS PIN"}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Dashboard credentials (create only) */}
              {!item && isDashboardEnabled && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="staff@example.com" {...field} disabled={isSubmitting} value={field.value ?? ""} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">Required for dashboard login</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Minimum 8 characters" {...field} disabled={isSubmitting} value={field.value ?? ""} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">Staff will receive an invitation to set their own password</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* POS PIN (create only) */}
              {!item && isPosEnabled && (
                <div className="mt-4 max-w-xs">
                  <FormField
                    control={form.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>POS PIN</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="4-6 digit PIN" maxLength={6} {...field} disabled={isSubmitting} value={field.value ?? ""} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">Optional — staff can set PIN on first device login</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact name" {...field} value={field.value ?? ""} disabled={isSubmitting} />
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
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <PhoneInput placeholder="Enter contact number" {...field} value={field.value ?? ""} disabled={isSubmitting} />
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
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter relationship" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder="Enter any additional notes" {...field} value={field.value ?? ""} disabled={isSubmitting} className="min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isSubmitting} label={item ? "Update staff" : "Create staff"} />
        </div>
      </form>
      {/* Grant Dashboard Access Modal */}
      {item && (
        <Dialog open={showDashboardModal} onOpenChange={setShowDashboardModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Grant Dashboard Access</DialogTitle>
              <DialogDescription>
                Enter login credentials for {item.firstName} {item.lastName}. They will receive an invitation email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="staff@example.com"
                  value={dashboardEmail}
                  onChange={(e) => setDashboardEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={dashboardPassword}
                  onChange={(e) => setDashboardPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowDashboardModal(false)}>Cancel</Button>
              <Button
                disabled={!dashboardEmail || dashboardPassword.length < 8 || accessLoading === "dashboard"}
                onClick={async () => {
                  setAccessLoading("dashboard");
                  try {
                    const r = await grantDashboardAccess(item.id, dashboardEmail, dashboardPassword);
                    toast({ variant: r.responseType === "success" ? "success" : "destructive", title: r.message });
                    if (r.responseType === "success") {
                      setShowDashboardModal(false);
                      setDashboardEmail("");
                      setDashboardPassword("");
                    }
                  } finally { setAccessLoading(null); }
                }}
              >
                {accessLoading === "dashboard" ? "Granting..." : "Grant Access"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Form>
  );
};

export default StaffForm;
