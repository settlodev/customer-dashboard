"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SectionCard } from "@/components/admin/shared/section-card";
import { DefList, DefRow } from "@/components/admin/shared/def-list";
import { formatInt } from "@/components/admin/shared/format";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import { updateSupplierFinancingProfile } from "@/lib/actions/admin/settlo-suppliers";
import {
  financingProfileSchema,
  type AdminSettloSupplier,
  type FinancingProfileInput,
} from "@/types/admin/settlo-suppliers";

interface FinancingCardProps {
  supplier: AdminSettloSupplier;
  canManage: boolean;
}

function valuesFromSupplier(
  supplier: AdminSettloSupplier,
): FinancingProfileInput {
  const profile = supplier.financingProfile;
  return {
    allowFinancing: profile?.allowFinancing ?? false,
    maxLoanPerOrder: profile?.maxLoanPerOrder ?? undefined,
    maxOutstandingExposure: profile?.maxOutstandingExposure ?? undefined,
  };
}

/**
 * FinancingCard — the supplier detail page's loan-eligibility panel:
 * opt-in switch, per-order and outstanding-exposure caps, and a
 * read-only current-exposure stat (0 when no financing profile exists
 * yet — the backend only creates one on first save). Saves through
 * `updateSupplierFinancingProfile`, which upserts the profile.
 */
export function FinancingCard({ supplier, canManage }: FinancingCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const form = useForm<FinancingProfileInput>({
    resolver: zodResolver(financingProfileSchema),
    defaultValues: valuesFromSupplier(supplier),
  });

  useEffect(() => {
    form.reset(valuesFromSupplier(supplier));
    setError("");
  }, [supplier, form]);

  const onSubmit = (values: FinancingProfileInput) => {
    setError("");
    startTransition(async () => {
      const result = await updateSupplierFinancingProfile(supplier.id, values);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  const currentExposure = supplier.financingProfile?.currentExposure ?? 0;
  const disabled = isPending || !canManage;

  return (
    <SectionCard
      title="Financing"
      subtitle="Loan-disbursement eligibility and exposure caps."
    >
      {supplier.verificationStatus !== "VERIFIED" && (
        <p className="mb-4 rounded-md bg-warn-tint px-3 py-2 text-[12px] text-warn">
          Financing runs only for approved suppliers.
        </p>
      )}

      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(onSubmit)(e);
          }}
          noValidate
        >
          {error && <FormError message={error} />}

          <FormField
            control={form.control}
            name="allowFinancing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-3 rounded-md border border-line px-3 py-2.5">
                <div className="min-w-0">
                  <FormLabel className="text-[13px] text-ink">
                    Allow financing
                  </FormLabel>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    Supplier is eligible for loan disbursement.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="maxLoanPerOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max loan per order</FormLabel>
                  <FormControl>
                    <NumericInput
                      value={field.value ?? null}
                      onChange={field.onChange}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxOutstandingExposure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max outstanding exposure</FormLabel>
                  <FormControl>
                    <NumericInput
                      value={field.value ?? null}
                      onChange={field.onChange}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DefList>
            <DefRow
              label="Current exposure"
              value={formatInt(currentExposure)}
            />
          </DefList>

          {canManage && (
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Save
              </Button>
            </div>
          )}
        </form>
      </Form>
    </SectionCard>
  );
}
