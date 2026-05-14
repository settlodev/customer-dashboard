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
  Bell,
  BellOff,
  Calendar as CalendarIcon,
  CheckCircle2,
  CreditCard,
  FileText,
  IdCard,
  Mail,
  Phone as PhoneIcon,
  Sparkles,
  Star,
  Tag,
  Trash2,
  User,
  Users,
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

import { CustomerSchema } from "@/types/customer/schema";
import {
  Customer,
  CustomerGroup,
  CUSTOMER_CREATED_FROM_LABELS,
  CUSTOMER_SOURCE_LABELS,
} from "@/types/customer/type";
import { FormResponse } from "@/types/types";
import { cn } from "@/lib/utils";
import {
  createCustomer,
  updateCustomer,
} from "@/lib/actions/customer-actions";
import { invalidateCustomersCache } from "@/lib/cache/reference-data";

import { initialsFor, thumbColor } from "@/components/tables/shared/table-avatar";
import styles from "./styles/form-shell.module.css";

interface CustomerFormProps {
  item: Customer | null | undefined;
  /**
   * Customer groups available at the current location. Server-fetched so
   * the picker is mounted with options ready and the form's
   * `customerGroupId` defaultValue lands on a valid id without a
   * client-side waterfall.
   */
  groups: CustomerGroup[];
}

type CustomerFormValues = z.infer<typeof CustomerSchema>;

export default function CustomerForm({ item, groups }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const today = useMemo(() => new Date(), []);
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [activeTab, setActiveTab] = useState<
    "contact" | "identification" | "loyalty" | "notes"
  >("contact");
  // Display string for credit-limit. Kept in component state so we can
  // show grouped digits (e.g. "1,200,000") while the form holds the
  // numeric primitive — the schema rejects string for this field.
  const [creditLimitDisplay, setCreditLimitDisplay] = useState<string>(
    item?.creditLimit != null ? item.creditLimit.toLocaleString() : "",
  );

  const isEditMode = !!item;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      firstName: item?.firstName ?? "",
      lastName: item?.lastName ?? "",
      gender: item?.gender,
      email: item?.email ?? "",
      phoneNumber: item?.phoneNumber ?? "",
      dateOfBirth: item?.dateOfBirth ?? undefined,
      idType: item?.idType ?? undefined,
      idNumber: item?.idNumber ?? undefined,
      tinNumber: item?.tinNumber ?? undefined,
      vrn: item?.vrn ?? undefined,
      creditLimit: item?.creditLimit ?? undefined,
      source: item?.source ?? undefined,
      createdFrom: item?.createdFrom ?? undefined,
      customerGroupId:
        (item?.customerGroupId as string | undefined) ?? undefined,
      notes: item?.notes ?? undefined,
      allowNotifications: item?.allowNotifications ?? true,
      active: item?.active ?? true,
    },
  });

  // Watched values feed both the live preview card and the per-section
  // completion checklist.
  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");
  const phoneNumber = form.watch("phoneNumber");
  const gender = form.watch("gender");
  const email = form.watch("email");
  const customerGroupId = form.watch("customerGroupId");
  const allowNotifications = form.watch("allowNotifications");
  const creditLimit = form.watch("creditLimit");

  const fullName = useMemo(
    () => `${firstName ?? ""} ${lastName ?? ""}`.trim(),
    [firstName, lastName],
  );

  const groupName = useMemo(() => {
    if (!customerGroupId) return undefined;
    return groups.find((g) => g.id === customerGroupId)?.name;
  }, [customerGroupId, groups]);

  // Required-field checklist mirrors the Zod schema's required fields.
  const requiredFlags = useMemo(
    () => [
      !!firstName?.trim(),
      !!lastName?.trim(),
      !!phoneNumber?.trim(),
      !!gender,
    ],
    [firstName, lastName, phoneNumber, gender],
  );
  const completion = Math.round(
    (requiredFlags.filter(Boolean).length / requiredFlags.length) * 100,
  );
  const isValid = requiredFlags.every(Boolean);
  const remainingFields = requiredFlags.filter((v) => !v).length;

  const formatCreditLimit = (value: string): string => {
    const numericValue = value.replace(/[^\d.]/g, "");
    if (!numericValue) return "";
    const number = parseInt(numericValue, 10);
    if (isNaN(number)) return "";
    return number.toLocaleString("en-US");
  };

  const parseCreditLimitToNumber = (value: string): number | undefined => {
    const numericValue = value.replace(/[^\d.]/g, "");
    if (!numericValue) return undefined;
    const number = parseFloat(numericValue);
    return isNaN(number) ? undefined : number;
  };

  const handleCreditLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatCreditLimit(rawValue);
    const parsedNumber = parseCreditLimitToNumber(rawValue);
    setCreditLimitDisplay(formattedValue);
    form.setValue("creditLimit", parsedNumber, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

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
    (values: CustomerFormValues) => {
      setResponse(undefined);
      startTransition(async () => {
        try {
          const result = isEditMode
            ? await updateCustomer(item!.id, values)
            : await createCustomer(values);
          if (!result) return;
          setResponse(result);
          if (result.responseType === "success") {
            invalidateCustomersCache();
            toast({
              variant: "success",
              title: isEditMode ? "Customer updated" : "Customer created",
              description: result.message,
            });
            router.push("/customers");
          } else {
            toast({
              variant: "destructive",
              title: "Couldn't save customer",
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
            <AlertTitle>We couldn&apos;t save this customer</AlertTitle>
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
            {/* Identity card — always visible */}
            <section className={styles.formCard}>
              <header className={styles.formCardHead}>
                <div className={styles.icoBox}>
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3>Identity</h3>
                  <p className={styles.formCardHeadDesc}>
                    The basics that identify this customer at the till and on
                    receipts.
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
                          Phone number <span className="req">*</span>
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
                    name="email"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Email
                          <span className="opt">OPTIONAL</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="customer@example.com"
                            disabled={isPending}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Allow-notifications toggle — sits inline as the sixth
                      grid cell so it shares the same vertical rhythm as
                      the input fields. Visual minimal: same h-10 chrome
                      as the inputs but with a Switch instead of a value. */}
                  <FormField
                    control={form.control}
                    name="allowNotifications"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Notifications
                        </FormLabel>
                        <div className="flex h-10 items-center justify-between gap-3 rounded-md border border-input bg-background px-3">
                          <span className="truncate text-xs text-muted-foreground">
                            Marketing &amp; reminders
                          </span>
                          <FormControl>
                            <Switch
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                        </div>
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
                      id: "contact",
                      label: "Contact",
                      icon: <PhoneIcon className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "identification",
                      label: "Identification",
                      icon: <FileText className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "loyalty",
                      label: "Loyalty & Group",
                      icon: <Star className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "notes",
                      label: "Notes",
                      icon: <Sparkles className="h-3.5 w-3.5" />,
                    },
                  ] as const
                ).map((t) => (
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

              {/* Contact — DOB, source / how acquired, notifications */}
              {activeTab === "contact" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <PhoneIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Contact details</h3>
                      <p className={styles.formCardHeadDesc}>
                        Birth date, where they came from, and whether they
                        accept marketing.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
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
                                    onSelect={(d) =>
                                      // Schema stores an ISO date string —
                                      // strip the time so the value matches
                                      // the backend's @Past LocalDate field.
                                      field.onChange(
                                        d
                                          ? d.toISOString().split("T")[0]
                                          : undefined,
                                      )
                                    }
                                    // Backend has @Past — disallow today and
                                    // any future date so the request
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
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              How acquired
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                              disabled={isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a source" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(CUSTOMER_SOURCE_LABELS).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="createdFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Created from
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                              disabled={isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Origin system" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(
                                  CUSTOMER_CREATED_FROM_LABELS,
                                ).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Identification — id type/number, TIN, VRN */}
              {activeTab === "identification" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Identification</h3>
                      <p className={styles.formCardHeadDesc}>
                        Optional — capture government ID and tax IDs needed
                        for credit terms or VAT-compliant receipts.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-4">
                      <FormField
                        control={form.control}
                        name="idType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              ID type
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Passport, NID"
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
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              ID number
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ID document number"
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
                        name="tinNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              TIN number
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Tax identification number"
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
                        name="vrn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              VRN
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="VAT registration number"
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

              {/* Loyalty & Group — credit limit, customer group */}
              {activeTab === "loyalty" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <Star className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Loyalty &amp; group</h3>
                      <p className={styles.formCardHeadDesc}>
                        Set a credit ceiling for credit-sale orders and place
                        this customer in a group for targeted campaigns.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="creditLimit"
                        render={() => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              <span className="inline-flex items-center gap-1">
                                <CreditCard className="h-3 w-3" /> Credit limit
                              </span>
                              <span className="opt">TZS</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 500,000"
                                value={creditLimitDisplay}
                                onChange={handleCreditLimitChange}
                                disabled={isPending}
                                inputMode="numeric"
                              />
                            </FormControl>
                            <p className={styles.fieldHint}>
                              Maximum balance allowed across all credit-sale
                              orders. Leave blank for cash-only.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerGroupId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              <span className="inline-flex items-center gap-1">
                                <Tag className="h-3 w-3" /> Customer group
                              </span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                              disabled={isPending || groups.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      groups.length === 0
                                        ? "No groups available"
                                        : "Select a group"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {groups.map((group) => (
                                  <SelectItem
                                    key={group.id}
                                    value={group.id as string}
                                  >
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Notes — staff notes + active toggle on edit */}
              {activeTab === "notes" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Notes</h3>
                      <p className={styles.formCardHeadDesc}>
                        Internal notes for staff — never shown to the
                        customer.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div
                      className={styles.fieldRow}
                      style={
                        {
                          ["--cols" as never]: 1,
                        } as React.CSSProperties
                      }
                    >
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Staff notes
                              <span className="opt">
                                {(field.value ?? "").length}/1000
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Allergies, seating preferences, anything teammates should know."
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

                    {isEditMode && (
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
                          name="active"
                          render={({ field }) => (
                            <FormItem className={styles.toggleRow}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  Customer status
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Inactive customers are hidden from the
                                  default list view but remain in reports.
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
                    )}
                  </div>
                </>
              )}
            </section>
          </div>

          {/* ── RIGHT — preview + readiness ───────────────────── */}
          <aside className={styles.formStack}>
            <LivePreviewCard
              fullName={fullName || "New customer"}
              phoneNumber={phoneNumber}
              email={email}
              gender={gender}
              groupName={groupName}
              creditLimit={creditLimit}
              allowNotifications={!!allowNotifications}
              checklist={[
                { label: "First name", done: requiredFlags[0] },
                { label: "Last name", done: requiredFlags[1] },
                { label: "Phone number", done: requiredFlags[2] },
                { label: "Gender", done: requiredFlags[3] },
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
                  : "Create customer"
                : `Complete required fields (${remainingFields} remaining)`
            }
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {isEditMode ? "Save changes" : "Create customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Right-rail: live preview card mirroring the staff live preview
// ─────────────────────────────────────────────────────────────────────

interface LivePreviewProps {
  fullName: string;
  phoneNumber: string | undefined;
  email: string | undefined;
  gender: string | undefined;
  groupName: string | undefined;
  creditLimit: number | undefined;
  allowNotifications: boolean;
  checklist: Array<{ label: string; done: boolean }>;
  completion: number;
}

function LivePreviewCard({
  fullName,
  phoneNumber,
  email,
  gender,
  groupName,
  creditLimit,
  allowNotifications,
  checklist,
  completion,
}: LivePreviewProps) {
  const initials = initialsFor(fullName || "?");
  const swatch = thumbColor(fullName);

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
          {phoneNumber || "no phone"}
          {gender ? ` · ${gender}` : ""}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {groupName && (
            <Badge variant="soft" className="text-[10.5px]">
              <Tag className="mr-1 h-2.5 w-2.5" /> {groupName}
            </Badge>
          )}
          {creditLimit != null && creditLimit > 0 && (
            <Badge variant="soft" className="text-[10.5px]">
              <CreditCard className="mr-1 h-2.5 w-2.5" />{" "}
              {creditLimit.toLocaleString()} TZS
            </Badge>
          )}
          {email && (
            <Badge variant="soft" className="text-[10.5px]">
              <Mail className="mr-1 h-2.5 w-2.5" /> Email
            </Badge>
          )}
          {allowNotifications ? (
            <Badge variant="pos" className="text-[10.5px]">
              <Bell className="mr-1 h-2.5 w-2.5" /> Notifications
            </Badge>
          ) : (
            <Badge variant="warn" className="text-[10.5px]">
              <BellOff className="mr-1 h-2.5 w-2.5" /> Muted
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
          icon: IdCard,
          text: "ID and tax fields are optional, but VRN is needed for VAT-compliant credit invoices.",
        },
        {
          icon: CreditCard,
          text: "Lower the credit limit to reduce exposure — open credit balances above the new ceiling stay attached but block new credit sales.",
        },
        {
          icon: Users,
          text: "Customers in the same group inherit campaigns and price lists — moving someone takes effect immediately.",
        },
      ]
    : [
        {
          icon: Sparkles,
          text: "First name, last name, phone, and gender are all that's required to create a customer.",
        },
        {
          icon: Bell,
          text: "Leave notifications on so reservation reminders and loyalty updates can reach this customer.",
        },
        {
          icon: CreditCard,
          text: "Set a credit limit only if this customer will have a credit-sale tab — otherwise leave blank.",
        },
        {
          icon: Tag,
          text: "Groups are optional. They're useful for targeted campaigns, group discounts, or VIP price lists.",
        },
      ];

  return (
    <div className={styles.previewCard}>
      <div className={styles.previewHead}>Tips</div>
      <div className="space-y-2.5 px-4 py-4">
        {tips.map(({ icon: Icon, text }, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-[12px] text-ink-3"
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0 text-primary mt-0.5" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
