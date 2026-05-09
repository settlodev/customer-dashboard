"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  StickyNote,
  Trash2,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import { createVendor, updateVendor } from "@/lib/actions/vendor-actions";
import { VendorSchema } from "@/types/vendor/schema";
import type { Vendor } from "@/types/vendor/type";

import styles from "./styles/form-shell.module.css";

interface Props {
  item: Vendor | null;
}

type FormValues = z.infer<typeof VendorSchema>;

export default function VendorForm({ item }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!item;

  const form = useForm<FormValues>({
    resolver: zodResolver(VendorSchema),
    defaultValues: {
      name: item?.name ?? "",
      contactPerson: item?.contactPerson ?? "",
      email: item?.email ?? "",
      phone: item?.phone ?? "",
      address: item?.address ?? "",
      taxNumber: item?.taxNumber ?? "",
      registrationNumber: item?.registrationNumber ?? "",
      defaultCurrencyCode: item?.defaultCurrencyCode ?? "",
      supplierId: item?.supplierId ?? "",
      notes: item?.notes ?? "",
    },
  });

  const submit = (values: FormValues) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateVendor(item!.id, values)
        : await createVendor(values);
      if (result.responseType === "success") {
        toast({
          variant: "success",
          title: "Success",
          description: result.message,
        });
        router.push("/vendors");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className={styles.formRoot}>
        <div className={styles.formStack}>
          {/* Identity */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Vendor identity</h3>
                <p className={styles.formCardHeadDesc}>
                  Who is the business buying from?
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Name <span className="req">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="ACME Supplies Ltd"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Contact person{" "}
                        <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isPending} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 mt-3.5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="taxNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Tax number <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isPending} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Registration number{" "}
                        <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isPending} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 mt-3.5">
                <FormField
                  control={form.control}
                  name="defaultCurrencyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Default currency{" "}
                        <span className="opt">DEFAULTS TO LOCATION</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          maxLength={3}
                          className="uppercase"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Mail className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Contact details</h3>
                <p className={styles.formCardHeadDesc}>
                  Email, phone, and address — all optional but useful.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          disabled={isPending}
                          placeholder="finance@acme.co.tz"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>Phone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="+255 7XX XXX XXX"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 mt-3.5">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} disabled={isPending} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <StickyNote className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Internal notes</h3>
                <p className={styles.formCardHeadDesc}>
                  Free-text notes — payment terms, preferred contacts, etc.
                </p>
              </div>
            </header>
            <div className={styles.formBody}>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} rows={3} disabled={isPending} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </section>
        </div>

        <div className={styles.formFoot}>
          <div className={styles.formFootSpacer} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anything you typed will be lost.
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
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isEdit ? "Save changes" : "Create vendor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
