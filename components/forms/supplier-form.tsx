"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  ControlInput,
  ControlTextarea,
  FieldLabel,
  controlSelectTriggerClass,
} from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Building2,
  CheckCircle2,
  FileBadge,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import type { FormResponse } from "@/types/types";
import type { Supplier, SettloSupplier } from "@/types/supplier/type";
import { SupplierSchema } from "@/types/supplier/schema";
import { createSupplier, updateSupplier } from "@/lib/actions/supplier-actions";
import { invalidateSuppliersCache } from "@/lib/cache/reference-data";
import { fetchSettloSupplierCatalog } from "@/lib/actions/settlo-supplier-actions";

import styles from "./styles/form-shell.module.css";

type FormValues = z.infer<typeof SupplierSchema>;

const UNLINKED = "__unlinked__";

function SupplierForm({ item }: { item: Supplier | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [catalog, setCatalog] = useState<SettloSupplier[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const isEditing = !!item;

  useEffect(() => {
    fetchSettloSupplierCatalog().then(setCatalog);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: item
      ? {
          name: item.name,
          contactPersonName: item.contactPersonName,
          contactPersonPhone: item.contactPersonPhone,
          contactPersonEmail: item.contactPersonEmail ?? "",
          phone: item.phone ?? "",
          email: item.email ?? "",
          address: item.address ?? "",
          notes: item.notes ?? "",
          registrationNumber: item.registrationNumber ?? "",
          tinNumber: item.tinNumber ?? "",
          settloSupplierId: item.settloSupplierId ?? "",
        }
      : {
          name: "",
          contactPersonName: "",
          contactPersonPhone: "",
          contactPersonEmail: "",
          phone: "",
          email: "",
          address: "",
          notes: "",
          registrationNumber: "",
          tinNumber: "",
          settloSupplierId: "",
        },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Check the form",
        description:
          typeof errors.message === "string" && errors.message
            ? errors.message
            : "Fix the highlighted fields and try again.",
      });
    },
    [toast],
  );

  const applyCatalogPick = (id: string) => {
    if (id === UNLINKED) {
      form.setValue("settloSupplierId", "");
      return;
    }
    const picked = catalog.find((c) => c.id === id);
    if (!picked) return;
    form.setValue("settloSupplierId", picked.id);
    if (!form.getValues("name")) form.setValue("name", picked.name);
    if (!form.getValues("email") && picked.email)
      form.setValue("email", picked.email);
    if (!form.getValues("phone") && picked.phone)
      form.setValue("phone", picked.phone);
    if (!form.getValues("address") && picked.address) {
      form.setValue("address", picked.address);
    }
    if (!form.getValues("registrationNumber") && picked.registrationNumber) {
      form.setValue("registrationNumber", picked.registrationNumber);
    }
    if (!form.getValues("tinNumber") && picked.tinNumber) {
      form.setValue("tinNumber", picked.tinNumber);
    }
  };

  const submit = (values: FormValues) => {
    startTransition(async () => {
      const res = item
        ? await updateSupplier(item.id, values)
        : await createSupplier(values);
      setResponse(res);
      if (res.responseType === "success") {
        invalidateSuppliersCache();
        toast({ variant: "success", title: "Saved", description: res.message });
        if (item) {
          router.refresh();
        } else {
          const created = (res.data as Supplier | undefined)?.id;
          router.push(created ? `/suppliers/${created}` : "/suppliers");
        }
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't save",
          description: res.message,
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formStack}>
          {catalog.length > 0 && (
            <section
              className={`${styles.formCard} ${styles.formCardOptional}`}
            >
              <header className={styles.formCardHead}>
                <div className={styles.icoBox}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3>
                    Marketplace link
                    <span className={styles.optionalTag}>OPTIONAL</span>
                  </h3>
                  <p className={styles.formCardHeadDesc}>
                    Linking to a Settlo-verified supplier pre-fills commercial
                    details and unlocks financing where available.
                  </p>
                </div>
              </header>
              <div className={styles.formBody}>
                <FormField
                  control={form.control}
                  name="settloSupplierId"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>Linked marketplace supplier</FieldLabel>
                      <Select
                        value={field.value || UNLINKED}
                        onValueChange={(v) => applyCatalogPick(v)}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger className={controlSelectTriggerClass}>
                            <SelectValue placeholder="Not linked" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UNLINKED}>Not linked</SelectItem>
                          {catalog.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                              {c.verificationStatus === "VERIFIED"
                                ? " · Verified"
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
          )}

          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Company</h3>
                <p className={styles.formCardHeadDesc}>
                  Trading name and where to reach the business itself.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Supplier name</FieldLabel>
                      <FormControl>
                        <ControlInput
                          placeholder="e.g. East Coast Foods Ltd"
                          {...field}
                          disabled={isPending}
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
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>Email</FieldLabel>
                      <FormControl>
                        <ControlInput
                          type="email"
                          placeholder="supplier@example.com"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>Company phone</FieldLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="Company switchboard"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>Address</FieldLabel>
                      <FormControl>
                        <ControlTextarea
                          placeholder="Street, city, country"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>
                        Notes
                        <span className="ml-auto font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                          OPTIONAL · INTERNAL
                        </span>
                      </FieldLabel>
                      <FormControl>
                        <ControlTextarea
                          placeholder="Internal notes about this supplier — payment terms, delivery quirks, contacts. Visible only to your team."
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <UserRound className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Contact person</h3>
                <p className={styles.formCardHeadDesc}>
                  The human you call at this supplier — separate from the
                  company switchboard.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contactPersonName"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Name</FieldLabel>
                      <FormControl>
                        <ControlInput
                          placeholder="Full name"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPersonPhone"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Phone</FieldLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="+255 ..."
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPersonEmail"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Email</FieldLabel>
                      <FormControl>
                        <ControlInput
                          type="email"
                          placeholder="contact@example.com"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          <section className={`${styles.formCard} ${styles.formCardOptional}`}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <FileBadge className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>
                  Registration
                  <span className={styles.optionalTag}>OPTIONAL</span>
                </h3>
                <p className={styles.formCardHeadDesc}>
                  Statutory IDs used on procurement documents and tax filings.
                </p>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>Registration number</FieldLabel>
                      <FormControl>
                        <ControlInput
                          placeholder="Optional"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
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
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>TIN</FieldLabel>
                      <FormControl>
                        <ControlInput
                          placeholder="Optional"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>
        </div>

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
                  Unsaved changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.back()}>
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" disabled={isPending}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {isEditing ? "Update supplier" : "Create supplier"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default SupplierForm;
