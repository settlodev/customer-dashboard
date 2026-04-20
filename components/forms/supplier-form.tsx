"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { ShieldCheck } from "lucide-react";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import type { FormResponse } from "@/types/types";
import type { Supplier, SettloSupplier } from "@/types/supplier/type";
import { SupplierSchema } from "@/types/supplier/schema";
import {
  createSupplier,
  updateSupplier,
} from "@/lib/actions/supplier-actions";
import { fetchSettloSupplierCatalog } from "@/lib/actions/settlo-supplier-actions";

type FormValues = z.infer<typeof SupplierSchema>;

const UNLINKED = "__unlinked__";

function SupplierForm({ item }: { item: Supplier | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [catalog, setCatalog] = useState<SettloSupplier[]>([]);
  const { toast } = useToast();
  const router = useRouter();

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
          phone: item.phone ?? "",
          email: item.email ?? "",
          address: item.address ?? "",
          registrationNumber: item.registrationNumber ?? "",
          tinNumber: item.tinNumber ?? "",
          settloSupplierId: item.settloSupplierId ?? "",
        }
      : {
          name: "",
          contactPersonName: "",
          contactPersonPhone: "",
          phone: "",
          email: "",
          address: "",
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

  /**
   * Picking a marketplace supplier pre-fills the commercial fields so the user
   * doesn't have to retype them. Contact person stays blank — that's always
   * the business user's own contact, not the marketplace record's.
   */
  const applyCatalogPick = (id: string) => {
    if (id === UNLINKED) {
      form.setValue("settloSupplierId", "");
      return;
    }
    const picked = catalog.find((c) => c.id === id);
    if (!picked) return;
    form.setValue("settloSupplierId", picked.id);
    if (!form.getValues("name")) form.setValue("name", picked.name);
    if (!form.getValues("email") && picked.email) form.setValue("email", picked.email);
    if (!form.getValues("phone") && picked.phone) form.setValue("phone", picked.phone);
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
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submit, onInvalid)} className="space-y-6">
        {/* Marketplace link */}
        {catalog.length > 0 && (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <h3 className="text-base font-medium">Marketplace link</h3>
                  <p className="text-xs text-muted-foreground">
                    Optional. Linking to a Settlo-verified supplier pre-fills
                    commercial details and unlocks financing features where
                    available.
                  </p>
                </div>
              </div>
              <FormField
                control={form.control}
                name="settloSupplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked marketplace supplier</FormLabel>
                    <Select
                      value={field.value || UNLINKED}
                      onValueChange={(v) => {
                        applyCatalogPick(v);
                      }}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Not linked" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UNLINKED}>Not linked</SelectItem>
                        {catalog.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            {c.verificationStatus === "VERIFIED" ? " · Verified" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            {/* Company */}
            <div>
              <h3 className="text-lg font-medium mb-4">Company</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Supplier name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
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
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
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
                    <FormItem>
                      <FormLabel>Company phone</FormLabel>
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
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
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
            </div>

            <Separator />

            {/* Contact person */}
            <div>
              <h3 className="text-lg font-medium mb-4">Contact person</h3>
              <p className="text-xs text-muted-foreground mb-4">
                The human we call at this supplier — separate from the company
                phone number.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPersonName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
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
                    <FormItem>
                      <FormLabel>
                        Phone <span className="text-red-500">*</span>
                      </FormLabel>
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
              </div>
            </div>

            <Separator />

            {/* Registration */}
            <div>
              <h3 className="text-lg font-medium mb-4">Registration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration number</FormLabel>
                      <FormControl>
                        <Input
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
                    <FormItem>
                      <FormLabel>TIN</FormLabel>
                      <FormControl>
                        <Input
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
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update supplier" : "Create supplier"}
          />
        </div>
      </form>
    </Form>
  );
}

export default SupplierForm;
