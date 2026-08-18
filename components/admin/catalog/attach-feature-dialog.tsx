"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { setPackageFeature } from "@/lib/actions/admin/billing";
import { SetPackageFeatureSchema } from "@/types/admin/schemas";
import {
  FeatureResponse,
  PackageFeatureMappingResponse,
  PackageResponse,
} from "@/types/admin/billing";

interface AttachFeatureDialogProps {
  pkg: PackageResponse;
  features: FeatureResponse[];
  alreadyAttached: PackageFeatureMappingResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttached: () => void;
}

type FormValues = z.infer<typeof SetPackageFeatureSchema>;

export function AttachFeatureDialog({
  pkg,
  features,
  alreadyAttached,
  open,
  onOpenChange,
  onAttached,
}: AttachFeatureDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(SetPackageFeatureSchema),
    defaultValues: {
      featureId: "",
      featureValue: "",
      isIncluded: true,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ featureId: "", featureValue: "", isIncluded: true });
      setError("");
    }
  }, [open, form]);

  // Hide features already on the package — re-adding is a no-op anyway,
  // and showing them in the dropdown invites a confusing "which one
  // wins?" mental model.
  const attachedKeys = useMemo(
    () => new Set(alreadyAttached.map((m) => m.feature.featureKey)),
    [alreadyAttached],
  );
  const available = useMemo(
    () => features.filter((f) => f.isActive !== false && !attachedKeys.has(f.featureKey)),
    [features, attachedKeys],
  );

  const onSubmit = (values: FormValues) => {
    setError("");
    startTransition(async () => {
      const result = await setPackageFeature(pkg.id, values);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: result.message });
      onAttached();
      onOpenChange(false);
    });
  };

  const selectedFeature = features.find(
    (f) => f.id === form.watch("featureId"),
  );
  const isLimit = selectedFeature?.featureType === "LIMIT";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Attach feature to {pkg.name}</DialogTitle>
          <DialogDescription>
            Pick a feature to add to this package. For LIMIT-type
            features, set the numeric value (e.g. {`"50"`} for max users).
          </DialogDescription>
        </DialogHeader>

        {error && <FormError message={error} />}

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
              name="featureId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending || available.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            available.length === 0
                              ? "All features already attached"
                              : "Pick a feature"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {available.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} ·{" "}
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {f.featureKey}
                          </span>
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
              name="featureValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isLimit ? "Limit value" : "Value"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isLimit ? "50" : "Optional"}
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {isLimit
                      ? "Numeric quota the platform enforces."
                      : "Optional — most CORE/ADVANCED features just need the include flag."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isIncluded"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border border-line p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value !== false}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Included in package</FormLabel>
                    <FormDescription>
                      Uncheck to mark the feature as explicitly excluded
                      (useful for explicit deny rules).
                    </FormDescription>
                  </div>
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
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  "Attach"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
