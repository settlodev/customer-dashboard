"use client";

import { useEffect, useState, useTransition } from "react";
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
  addSubscriptionAddon,
  listAddons,
} from "@/lib/actions/admin/billing";
import { AddSubscriptionAddonSchema } from "@/types/admin/schemas";
import {
  AddonResponse,
  SubscriptionItemResponse,
} from "@/types/admin/billing";

interface AddAddonDialogProps {
  businessId: string;
  items: SubscriptionItemResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function AddAddonDialog({
  businessId,
  items,
  open,
  onOpenChange,
  onAdded,
}: AddAddonDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [addons, setAddons] = useState<AddonResponse[] | null>(null);
  const [loadingAddons, setLoadingAddons] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof AddSubscriptionAddonSchema>>({
    resolver: zodResolver(AddSubscriptionAddonSchema),
    defaultValues: {
      subscriptionItemId: items[0]?.id ?? "",
      addonId: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        subscriptionItemId: items[0]?.id ?? "",
        addonId: "",
      });
      setError("");
      return;
    }
    let cancelled = false;
    setLoadingAddons(true);
    setLoadError(null);
    listAddons()
      .then((list) => {
        if (cancelled) return;
        setAddons(list.filter((a) => a.isActive));
      })
      .catch((err: any) => {
        if (cancelled) return;
        setLoadError(err?.message ?? "Failed to load addons.");
      })
      .finally(() => {
        if (!cancelled) setLoadingAddons(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, items, form]);

  const onSubmit = (values: z.infer<typeof AddSubscriptionAddonSchema>) => {
    setError("");
    startTransition(async () => {
      const result = await addSubscriptionAddon(businessId, values);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: result.message });
      onAdded();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Attach addon to subscription</DialogTitle>
          <DialogDescription>
            Adds a paid addon to the chosen subscription item. The billing
            service issues a prorated invoice for the rest of the cycle.
          </DialogDescription>
        </DialogHeader>

        {error && <FormError message={error} />}
        {loadError && <FormError message={loadError} />}

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
                          {item.packageInfo?.name ?? item.entityType} · {item.status}
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
              name="addonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Addon</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending || loadingAddons || !addons}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingAddons ? "Loading addons…" : "Pick an addon"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {addons?.map((addon) => (
                        <SelectItem key={addon.id} value={addon.id}>
                          {addon.name} · {addon.entityType} ·{" "}
                          {formatMoney(addon.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button type="submit" disabled={isPending || loadingAddons}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Attaching…
                  </span>
                ) : (
                  "Attach addon"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
