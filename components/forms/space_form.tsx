"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CornerDownRight,
  LayoutGrid,
  Palette,
  Power,
  Sparkles,
  StickyNote,
  Tag,
  Table2,
  Timer,
  Trash2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import {
  createSpace,
  fetchAllSpaces,
  fetchFloorPlans,
  updateSpace,
} from "@/lib/actions/space-actions";
import { SpaceSchema } from "@/types/space/schema";
import {
  Space,
  FloorPlan,
  SPACE_TYPES,
  TABLE_SPACE_TYPE_LABELS,
  TABLE_STATUS_LABELS,
} from "@/types/space/type";
import { TableSpaceType, TableStatus } from "@/types/enums";
import { FormResponse } from "@/types/types";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";

import styles from "./styles/form-shell.module.css";

type SpaceFormValues = z.infer<typeof SpaceSchema>;

interface SpaceFormProps {
  item: Space | null | undefined;
}

export default function SpaceForm({ item }: SpaceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [activeTab, setActiveTab] = useState<
    "capacity" | "layout" | "status" | "notes"
  >("capacity");

  const isEditMode = !!item;

  const form = useForm<SpaceFormValues>({
    resolver: zodResolver(SpaceSchema),
    defaultValues: item
      ? {
          name: item.name,
          code: item.code ?? undefined,
          capacity: item.capacity,
          minCapacity: item.minCapacity ?? undefined,
          type: item.type,
          tableStatus: item.tableStatus ?? undefined,
          active: item.active,
          reservable: item.reservable,
          turnTimeMinutes: item.turnTimeMinutes ?? undefined,
          posX: item.posX ?? undefined,
          posY: item.posY ?? undefined,
          color: item.color ?? undefined,
          needsCleaning: item.needsCleaning,
          description: item.description ?? undefined,
          sortOrder: item.sortOrder ?? undefined,
          parentSpaceId: item.parentSpaceId ?? undefined,
          floorPlanId: item.floorPlanId ?? undefined,
        }
      : {
          active: true,
          reservable: true,
          needsCleaning: false,
          type: "TABLE" as TableSpaceType,
          capacity: 2,
        },
  });

  useEffect(() => {
    const loadRelatedData = async () => {
      try {
        const [spacesData, floorPlansData] = await Promise.all([
          fetchAllSpaces(),
          fetchFloorPlans(),
        ]);
        setSpaces(spacesData);
        setFloorPlans(floorPlansData);
      } catch (error) {
        console.error("Failed to load related data:", error);
      }
    };
    loadRelatedData();
  }, []);

  const name = form.watch("name");
  const code = form.watch("code");
  const type = form.watch("type");
  const capacity = form.watch("capacity");
  const minCapacity = form.watch("minCapacity");
  const color = form.watch("color");
  const active = form.watch("active");
  const reservable = form.watch("reservable");
  const needsCleaning = form.watch("needsCleaning");
  const parentSpaceId = form.watch("parentSpaceId");
  const floorPlanId = form.watch("floorPlanId");

  const isBookableType = type === "TABLE" || type === "SEAT";

  const parentSpaces = useMemo(
    () => spaces.filter((s) => SPACE_TYPES.includes(s.type) && s.id !== item?.id),
    [spaces, item?.id],
  );

  const parentName = useMemo(() => {
    if (!parentSpaceId) return undefined;
    return parentSpaces.find((s) => s.id === parentSpaceId)?.name;
  }, [parentSpaceId, parentSpaces]);

  const floorPlanName = useMemo(() => {
    if (!floorPlanId) return undefined;
    return floorPlans.find((p) => p.id === floorPlanId)?.name;
  }, [floorPlanId, floorPlans]);

  // Required-field checklist mirrors the Zod schema's required fields.
  const requiredFlags = useMemo(
    () => [!!name?.trim(), !!type, capacity != null && capacity > 0],
    [name, type, capacity],
  );
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
    (values: SpaceFormValues) => {
      setResponse(undefined);
      startTransition(async () => {
        try {
          const result = isEditMode
            ? await updateSpace(item!.id, values, item!.version)
            : await createSpace(values);
          if (!result) return;
          setResponse(result);
          if (result.responseType === "success") {
            toast({
              variant: "success",
              title: isEditMode ? "Table / space updated" : "Table / space created",
              description: SettloErrorHandler.safeMessage(result.message),
            });
            router.push("/spaces");
          } else {
            toast({
              variant: "destructive",
              title: "Couldn't save",
              description: SettloErrorHandler.safeMessage(
                result.message,
                isEditMode
                  ? "Failed to update table/space"
                  : "Failed to create table/space",
              ),
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
            <AlertTitle>We couldn&apos;t save this table / space</AlertTitle>
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
                  <LayoutGrid className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3>Identity</h3>
                  <p className={styles.formCardHeadDesc}>
                    Give this table or space a name and pick what it represents.
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
                    name="name"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Name <span className="req">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Table 1, Bar Area"
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
                    name="code"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Code
                          <span className="opt">OPTIONAL</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. T1"
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
                    name="type"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Type <span className="req">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(TableSpaceType).map((t) => (
                              <SelectItem key={t} value={t}>
                                {TABLE_SPACE_TYPE_LABELS[t]}
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
            </section>

            {/* Tabs section */}
            <section className={styles.formCard}>
              <div className={styles.formTabs} role="tablist">
                {(
                  [
                    {
                      id: "capacity",
                      label: "Capacity",
                      icon: <Users className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "layout",
                      label: "Layout",
                      icon: <CornerDownRight className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "status",
                      label: "Status",
                      icon: <Activity className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "notes",
                      label: "Notes",
                      icon: <StickyNote className="h-3.5 w-3.5" />,
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

              {/* Capacity */}
              {activeTab === "capacity" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Capacity & turn time</h3>
                      <p className={styles.formCardHeadDesc}>
                        How many people fit, and how long they tend to stay.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Maximum capacity{" "}
                              <span className="req">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g. 4"
                                min={1}
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : parseInt(e.target.value, 10),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Minimum capacity
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="No minimum"
                                min={1}
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : parseInt(e.target.value, 10),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isBookableType && (
                        <FormField
                          control={form.control}
                          name="turnTimeMinutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={styles.fieldLabel}>
                                Turn time
                                <span className="opt">MINUTES</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Default: 15"
                                  min={0}
                                  step={5}
                                  disabled={isPending}
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? undefined
                                        : parseInt(e.target.value, 10),
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Layout */}
              {activeTab === "layout" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <CornerDownRight className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Layout & hierarchy</h3>
                      <p className={styles.formCardHeadDesc}>
                        Where this lives on the floor and which section it
                        rolls up to.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="parentSpaceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Parent space
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                              disabled={isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="None (top-level)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {parentSpaces.map((s) => (
                                  <SelectItem
                                    key={s.id}
                                    value={s.id as string}
                                  >
                                    {s.name} (
                                    {TABLE_SPACE_TYPE_LABELS[s.type]})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="floorPlanId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Floor plan
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                              disabled={isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {floorPlans.map((p) => (
                                  <SelectItem
                                    key={p.id}
                                    value={p.id as string}
                                  >
                                    {p.name}
                                    {p.isDefault ? " (default)" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Sort order
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                min={0}
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : parseInt(e.target.value, 10),
                                  )
                                }
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
                            <FormLabel className={styles.fieldLabel}>
                              Color
                              <span className="opt">HEX</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="#10b981"
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
                        name="posX"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Position X
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                min={0}
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : parseInt(e.target.value, 10),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="posY"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Position Y
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                min={0}
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : parseInt(e.target.value, 10),
                                  )
                                }
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

              {/* Status */}
              {activeTab === "status" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>State & operations</h3>
                      <p className={styles.formCardHeadDesc}>
                        Live availability, reservation rules, and cleaning
                        flags.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                      {isEditMode && (
                        <FormField
                          control={form.control}
                          name="tableStatus"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel className={styles.fieldLabel}>
                                Live table status
                                <span className="opt">OPTIONAL</span>
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value ?? ""}
                                disabled={isPending}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Not set" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.values(TableStatus).map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {TABLE_STATUS_LABELS[s]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className={styles.toggleRow}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">Active</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Inactive tables are hidden from the floor and
                                booking flows.
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

                      {isBookableType && (
                        <FormField
                          control={form.control}
                          name="reservable"
                          render={({ field }) => (
                            <FormItem className={styles.toggleRow}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  Reservable
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Allow this table to accept advance bookings.
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
                      )}

                      <FormField
                        control={form.control}
                        name="needsCleaning"
                        render={({ field }) => (
                          <FormItem className={styles.toggleRow}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                Needs cleaning
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Flag this table for a turnover before next
                                seating.
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
                  </div>
                </>
              )}

              {/* Notes */}
              {activeTab === "notes" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <StickyNote className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Description</h3>
                      <p className={styles.formCardHeadDesc}>
                        Internal notes that staff will see when assigning
                        tables.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={styles.fieldLabel}>
                            Notes
                            <span className="opt">OPTIONAL</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g. Window seat, near patio entrance, accessible…"
                              disabled={isPending}
                              rows={5}
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </section>
          </div>

          {/* ── RIGHT — preview + tips ─────────────────────────── */}
          <aside className={styles.formStack}>
            <SpaceLivePreviewCard
              name={name || "New table or space"}
              code={code}
              type={type}
              capacity={capacity}
              minCapacity={minCapacity}
              color={color}
              active={!!active}
              reservable={!!reservable}
              needsCleaning={!!needsCleaning}
              parentName={parentName}
              floorPlanName={floorPlanName}
              checklist={[
                { label: "Name", done: requiredFlags[0] },
                { label: "Type", done: requiredFlags[1] },
                { label: "Maximum capacity", done: requiredFlags[2] },
              ]}
              completion={completion}
            />

            <SpaceTipsCard isEdit={isEditMode} isBookable={isBookableType} />
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
                  : "Create table / space"
                : `Complete required fields (${remainingFields} remaining)`
            }
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {isEditMode ? "Save changes" : "Create table / space"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Right-rail: live preview card
// ─────────────────────────────────────────────────────────────────────

interface SpaceLivePreviewProps {
  name: string;
  code: string | undefined;
  type: string | undefined;
  capacity: number | undefined;
  minCapacity: number | undefined;
  color: string | undefined;
  active: boolean;
  reservable: boolean;
  needsCleaning: boolean;
  parentName: string | undefined;
  floorPlanName: string | undefined;
  checklist: Array<{ label: string; done: boolean }>;
  completion: number;
}

function SpaceLivePreviewCard({
  name,
  code,
  type,
  capacity,
  minCapacity,
  color,
  active,
  reservable,
  needsCleaning,
  parentName,
  floorPlanName,
  checklist,
  completion,
}: SpaceLivePreviewProps) {
  const swatch = color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#10b981";
  const typeLabel = type
    ? (TABLE_SPACE_TYPE_LABELS[type as TableSpaceType] ?? type)
    : "—";
  const capacityLabel =
    minCapacity != null && capacity != null
      ? `${minCapacity}–${capacity}`
      : capacity != null
        ? `${capacity}`
        : "—";

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
          <LayoutGrid className="h-10 w-10 text-white opacity-90" />
        </div>
        <div className={styles.previewName}>{name}</div>
        <div className={styles.previewMeta}>
          {typeLabel}
          {code ? ` · ${code}` : ""}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge variant="soft" className="text-[10.5px]">
            <Users className="mr-1 h-2.5 w-2.5" /> {capacityLabel} seats
          </Badge>
          {parentName && (
            <Badge variant="soft" className="text-[10.5px]">
              <CornerDownRight className="mr-1 h-2.5 w-2.5" /> {parentName}
            </Badge>
          )}
          {floorPlanName && (
            <Badge variant="soft" className="text-[10.5px]">
              <Palette className="mr-1 h-2.5 w-2.5" /> {floorPlanName}
            </Badge>
          )}
          {reservable && (
            <Badge variant="pos" className="text-[10.5px]">
              <Sparkles className="mr-1 h-2.5 w-2.5" /> Reservable
            </Badge>
          )}
          {!active && (
            <Badge variant="warn" className="text-[10.5px]">
              <Power className="mr-1 h-2.5 w-2.5" /> Inactive
            </Badge>
          )}
          {needsCleaning && (
            <Badge variant="warn" className="text-[10.5px]">
              <Sparkles className="mr-1 h-2.5 w-2.5" /> Needs cleaning
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

function SpaceTipsCard({
  isEdit,
  isBookable,
}: {
  isEdit: boolean;
  isBookable: boolean;
}) {
  const tips = isEdit
    ? [
        {
          icon: Tag,
          text: "Renaming a table is safe — open orders and bookings keep their reference.",
        },
        {
          icon: Timer,
          text: "Lower the turn time only if you've actually trimmed your service flow — too tight and walk-ins get turned away.",
        },
        {
          icon: Activity,
          text: "Live status (Available, Seated, Dirty…) is normally driven from the POS — set it manually only to override.",
        },
      ]
    : [
        {
          icon: Sparkles,
          text: "Name, type, and maximum capacity are all that's required to add a table or space.",
        },
        {
          icon: Table2,
          text: isBookable
            ? "Tables and seats accept reservations by default — flip the toggle if this one is permanently walk-in only."
            : "Sections, halls, rooms, and bars don't accept bookings directly — they group their child tables.",
        },
        {
          icon: CornerDownRight,
          text: "Parent space groups several tables under a section, hall, or room — useful for a busy floor plan.",
        },
        {
          icon: Palette,
          text: "Set a colour to make this stand out on the floor plan — staff can spot priorities at a glance.",
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
