"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import {
  listPackages,
  upgradeSubscriptionPlan,
} from "@/lib/actions/admin/billing";
import { UpgradePlanSchema } from "@/types/admin/schemas";
import {
  PackageResponse,
  SubscriptionItemResponse,
} from "@/types/admin/billing";

interface UpgradePlanDialogProps {
  businessId: string;
  items: SubscriptionItemResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgraded: () => void;
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function UpgradePlanDialog({
  businessId,
  items,
  open,
  onOpenChange,
  onUpgraded,
}: UpgradePlanDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [packages, setPackages] = useState<PackageResponse[] | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof UpgradePlanSchema>>({
    resolver: zodResolver(UpgradePlanSchema),
    defaultValues: {
      subscriptionItemId: items[0]?.id ?? "",
      newPackageId: "",
    },
  });

  // Reset every time the dialog reopens so a previously selected stale
  // item doesn't sit in the form after the parent refreshes.
  useEffect(() => {
    if (!open) {
      form.reset({
        subscriptionItemId: items[0]?.id ?? "",
        newPackageId: "",
      });
      setError("");
      return;
    }
    let cancelled = false;
    setLoadingPackages(true);
    setPackagesError(null);
    listPackages()
      .then((list) => {
        if (cancelled) return;
        // Only active packages — server returns all; we filter for the
        // staff UI to avoid presenting a deprecated plan as an upgrade.
        setPackages(list.filter((p) => p.isActive));
      })
      .catch((err: any) => {
        if (cancelled) return;
        setPackagesError(err?.message ?? "Failed to load packages.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPackages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, items, form]);

  const onSubmit = (values: z.infer<typeof UpgradePlanSchema>) => {
    setError("");
    startTransition(async () => {
      const result = await upgradeSubscriptionPlan(businessId, values);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: result.message });
      onUpgraded();
      onOpenChange(false);
    });
  };

  const selectedItem = useMemo(
    () => items.find((i) => i.id === form.watch("subscriptionItemId")) ?? null,
    [items, form],
  );

  const selectedPackage = useMemo(
    () => packages?.find((p) => p.id === form.watch("newPackageId")) ?? null,
    [packages, form],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Upgrade subscription plan</DialogTitle>
          <DialogDescription>
            Switch a subscription item to a different package. The billing
            service auto-generates a prorated invoice for the remaining
            cycle — no need to issue one manually.
          </DialogDescription>
        </DialogHeader>

        {error && <FormError message={error} />}
        {packagesError && <FormError message={packagesError} />}

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }}
            noValidate
          >
            <FormField
              control={form.control}
              name="subscriptionItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription item</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending || items.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pick a subscription item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.packageInfo?.name ?? item.entityType} ·{" "}
                          {item.status}
                          {item.packageInfo?.basePrice != null
                            ? ` · ${formatMoney(item.packageInfo.basePrice)}`
                            : ""}
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
              name="newPackageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New package</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending || loadingPackages || !packages}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingPackages
                              ? "Loading packages…"
                              : "Pick a package"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {packages?.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} · {pkg.entityType} ·{" "}
                          {formatMoney(pkg.basePrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedItem && selectedPackage && (
                    <FormDescription>
                      {formatMoney(selectedItem.packageInfo?.basePrice)} →{" "}
                      {formatMoney(selectedPackage.basePrice)} ·{" "}
                      {selectedPackage.entityType.toLowerCase()}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || loadingPackages}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Upgrading…
                  </span>
                ) : (
                  "Upgrade plan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
