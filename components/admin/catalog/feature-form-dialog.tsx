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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { createFeature, updateFeature } from "@/lib/actions/admin/billing";
import { CreateFeatureSchema } from "@/types/admin/schemas";
import { FeatureResponse } from "@/types/admin/billing";

interface FeatureFormDialogProps {
  feature: FeatureResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

type FormValues = z.infer<typeof CreateFeatureSchema>;

const FEATURE_TYPES = ["CORE", "ADVANCED", "PREMIUM", "LIMIT"] as const;

function emptyValues(): FormValues {
  return {
    name: "",
    featureKey: "",
    featureType: "CORE",
    description: "",
  };
}

function valuesFromFeature(f: FeatureResponse): FormValues {
  return {
    name: f.name,
    featureKey: f.featureKey,
    featureType: f.featureType,
    description: f.description ?? "",
  };
}

export function FeatureFormDialog({
  feature,
  open,
  onOpenChange,
  onSaved,
}: FeatureFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();
  const isEdit = feature !== null;

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateFeatureSchema),
    defaultValues: feature ? valuesFromFeature(feature) : emptyValues(),
  });

  useEffect(() => {
    if (!open) {
      form.reset(emptyValues());
      setError("");
      return;
    }
    form.reset(feature ? valuesFromFeature(feature) : emptyValues());
  }, [open, feature, form]);

  const onSubmit = (values: FormValues) => {
    setError("");
    startTransition(async () => {
      const result = feature
        ? await updateFeature(feature.id, values)
        : await createFeature(values);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: result.message });
      onSaved();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit feature" : "New feature"}</DialogTitle>
          <DialogDescription>
            Features are the building blocks of package entitlements. The
            key is what the rest of the platform checks against
            (e.g.&nbsp;{`"reports.advanced"`}) — changing it after launch
            invalidates entitlement caches.
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Advanced reports"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featureKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="reports.advanced"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Lowercase, dot or underscore separators. Used by other
                    services to look up entitlements.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featureType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FEATURE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    LIMIT = numeric quota (e.g.&nbsp;{`"max_users: 50"`}).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What this feature unlocks"
                      disabled={isPending}
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
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
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </span>
                ) : isEdit ? (
                  "Save changes"
                ) : (
                  "Create feature"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
