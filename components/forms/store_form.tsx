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
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  Hash,
  MapPin,
  Settings2,
  Sparkles,
  Store as StoreIcon,
  Tag,
  Trash2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { createStore, updateStore } from "@/lib/actions/store-actions";
import { Store } from "@/types/store/type";
import { StoreSchema } from "@/types/store/schema";
import { FormResponse } from "@/types/types";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getAuthToken } from "@/lib/auth-utils";

import styles from "./styles/form-shell.module.css";

type StoreFormValues = z.infer<typeof StoreSchema>;

interface StoreFormProps {
  item: Store | null | undefined;
}

export default function StoreForm({ item }: StoreFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [businessId, setBusinessId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [activeTab, setActiveTab] = useState<
    "profile" | "address" | "coordinates"
  >("profile");

  const isEditMode = !!item;

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(StoreSchema),
    defaultValues: {
      name: item?.name ?? "",
      businessId: item?.businessId ?? "",
      locationId: item?.locationId ?? "",
      code: item?.code ?? "",
      storeNumber: item?.storeNumber ?? "",
      storeType: item?.storeType ?? "",
      timezone: item?.timezone ?? "",
      region: item?.region ?? "",
      district: item?.district ?? "",
      ward: item?.ward ?? "",
      address: item?.address ?? "",
      postalCode: item?.postalCode ?? "",
      latitude: item?.latitude ?? undefined,
      longitude: item?.longitude ?? undefined,
      capacity: item?.capacity ?? undefined,
    },
  });

  useEffect(() => {
    async function loadContext() {
      const [token, loc] = await Promise.all([
        getAuthToken(),
        getCurrentLocation(),
      ]);
      if (token?.businessId) setBusinessId(token.businessId);
      if (loc?.id) setLocationId(loc.id);
    }
    loadContext();
  }, []);

  useEffect(() => {
    if (businessId && !form.getValues("businessId"))
      form.setValue("businessId", businessId);
    if (locationId && !form.getValues("locationId"))
      form.setValue("locationId", locationId);
  }, [businessId, locationId, form]);

  const name = form.watch("name");
  const code = form.watch("code");
  const storeType = form.watch("storeType");
  const region = form.watch("region");
  const district = form.watch("district");
  const address = form.watch("address");
  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");
  const capacity = form.watch("capacity");

  const requiredFlags = useMemo(
    () => [!!name?.trim(), !!businessId, !!locationId],
    [name, businessId, locationId],
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
    (values: StoreFormValues) => {
      setResponse(undefined);
      startTransition(async () => {
        try {
          const result = isEditMode
            ? await updateStore(item!.id, values)
            : await createStore(values);
          if (!result) return;
          setResponse(result);
          if (result.responseType === "success") {
            toast({
              variant: "success",
              title: isEditMode ? "Store updated" : "Store created",
              description: isEditMode
                ? result.message
                : "Complete the subscription setup on the store page.",
            });
            router.push("/stores");
          } else {
            toast({
              variant: "destructive",
              title: "Couldn't save store",
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
            <AlertTitle>We couldn&apos;t save this store</AlertTitle>
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
                  <StoreIcon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3>Identity</h3>
                  <p className={styles.formCardHeadDesc}>
                    What this store is called and how staff find it on the
                    POS.
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
                          Store name <span className="req">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Main Street Store"
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
                            placeholder="e.g. STORE-001"
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
                    name="storeNumber"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Store number
                          <span className="opt">OPTIONAL</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 12"
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
                <input type="hidden" {...form.register("businessId")} />
                <input type="hidden" {...form.register("locationId")} />
              </div>
            </section>

            {/* Tabs section */}
            <section className={styles.formCard}>
              <div className={styles.formTabs} role="tablist">
                {(
                  [
                    {
                      id: "profile",
                      label: "Profile",
                      icon: <Settings2 className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "address",
                      label: "Address",
                      icon: <MapPin className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "coordinates",
                      label: "Coordinates",
                      icon: <Globe className="h-3.5 w-3.5" />,
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

              {/* Profile */}
              {activeTab === "profile" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <Settings2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Operating profile</h3>
                      <p className={styles.formCardHeadDesc}>
                        Type, timezone, and capacity — used by reports and
                        scheduling.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="storeType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Store type
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Restaurant, Bar, Retail"
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
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Timezone
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Africa/Dar_es_Salaam"
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
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Capacity
                              <span className="opt">SEATS</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g. 60"
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

              {/* Address */}
              {activeTab === "address" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Address</h3>
                      <p className={styles.formCardHeadDesc}>
                        Used on receipts, delivery dispatch, and tax filings.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2 xl:col-span-3">
                            <FormLabel className={styles.fieldLabel}>
                              Street address
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 123 Main Street"
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
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Region
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Dar es Salaam"
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
                        name="district"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              District
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Kinondoni"
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
                        name="ward"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Ward
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Mikocheni"
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
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Postal code
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 14110"
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

              {/* Coordinates */}
              {activeTab === "coordinates" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <Globe className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Coordinates</h3>
                      <p className={styles.formCardHeadDesc}>
                        GPS coordinates power pickup, delivery, and map
                        directions.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Latitude
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="e.g. -6.7924"
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : parseFloat(e.target.value),
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
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Longitude
                              <span className="opt">OPTIONAL</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="e.g. 39.2083"
                                disabled={isPending}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : parseFloat(e.target.value),
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
            </section>
          </div>

          {/* ── RIGHT — preview + tips ─────────────────────────── */}
          <aside className={styles.formStack}>
            <StoreLivePreviewCard
              name={name || "New store"}
              code={code}
              storeType={storeType}
              region={region}
              district={district}
              address={address}
              capacity={capacity}
              hasCoords={latitude != null && longitude != null}
              checklist={[
                { label: "Store name", done: requiredFlags[0] },
                { label: "Business context", done: requiredFlags[1] },
                { label: "Location context", done: requiredFlags[2] },
              ]}
              completion={completion}
            />
            <StoreTipsCard isEdit={isEditMode} />
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
                  : "Create store"
                : `Complete required fields (${remainingFields} remaining)`
            }
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {isEditMode ? "Save changes" : "Create store"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Right-rail: live preview card
// ─────────────────────────────────────────────────────────────────────

interface StoreLivePreviewProps {
  name: string;
  code: string | undefined;
  storeType: string | undefined;
  region: string | undefined;
  district: string | undefined;
  address: string | undefined;
  capacity: number | undefined;
  hasCoords: boolean;
  checklist: Array<{ label: string; done: boolean }>;
  completion: number;
}

function StoreLivePreviewCard({
  name,
  code,
  storeType,
  region,
  district,
  address,
  capacity,
  hasCoords,
  checklist,
  completion,
}: StoreLivePreviewProps) {
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
            background:
              "linear-gradient(135deg, hsl(265 80% 55%), hsl(265 80% 70%))",
          }}
        >
          <StoreIcon className="h-10 w-10 text-white opacity-90" />
        </div>
        <div className={styles.previewName}>{name}</div>
        <div className={styles.previewMeta}>
          {storeType || "Store"}
          {code ? ` · ${code}` : ""}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {address && (
            <Badge variant="soft" className="text-[10.5px]">
              <MapPin className="mr-1 h-2.5 w-2.5" />{" "}
              {address.length > 24
                ? `${address.substring(0, 24)}…`
                : address}
            </Badge>
          )}
          {region && (
            <Badge variant="soft" className="text-[10.5px]">
              <Globe className="mr-1 h-2.5 w-2.5" /> {region}
            </Badge>
          )}
          {district && (
            <Badge variant="soft" className="text-[10.5px]">
              <Building2 className="mr-1 h-2.5 w-2.5" /> {district}
            </Badge>
          )}
          {capacity != null && capacity > 0 && (
            <Badge variant="soft" className="text-[10.5px]">
              <Users className="mr-1 h-2.5 w-2.5" /> {capacity} seats
            </Badge>
          )}
          {hasCoords ? (
            <Badge variant="pos" className="text-[10.5px]">
              <Globe className="mr-1 h-2.5 w-2.5" /> Mapped
            </Badge>
          ) : (
            <Badge variant="warn" className="text-[10.5px]">
              <Globe className="mr-1 h-2.5 w-2.5" /> No coords
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

function StoreTipsCard({ isEdit }: { isEdit: boolean }) {
  const tips = isEdit
    ? [
        {
          icon: Tag,
          text: "Renaming a store is safe — receipts, settings, and subscriptions all stay attached to the same record.",
        },
        {
          icon: Globe,
          text: "Updating coordinates re-activates pickup and delivery flows that depend on map distance.",
        },
        {
          icon: Clock,
          text: "Timezone affects how reports group sales by day — change it carefully if shifts span midnight.",
        },
      ]
    : [
        {
          icon: Sparkles,
          text: "All you need to create a store is a name — address and coordinates can be filled in later.",
        },
        {
          icon: Hash,
          text: "Codes and store numbers help staff identify the right outlet quickly when there are multiple stores in one area.",
        },
        {
          icon: MapPin,
          text: "Add address and coordinates if customers will use the storefront for pickup, delivery, or directions.",
        },
        {
          icon: StoreIcon,
          text: "After creation you'll be prompted to confirm subscription billing — that's how this store starts ringing up sales.",
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
