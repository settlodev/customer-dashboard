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

import { createPackage, updatePackage } from "@/lib/actions/admin/billing";
import { CreatePackageSchema } from "@/types/admin/schemas";
import { PackageResponse } from "@/types/admin/billing";

interface PackageFormDialogProps {
  pkg: PackageResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

type FormValues = z.infer<typeof CreatePackageSchema>;

const ENTITY_TYPES = ["LOCATION", "WAREHOUSE", "STORE"] as const;

function emptyValues(): FormValues {
  return {
    name: "",
    description: "",
    basePrice: 0,
    entityType: "LOCATION",
    includedWarehouseCount: undefined,
    includedStoreCount: undefined,
  };
}

function valuesFromPackage(pkg: PackageResponse): FormValues {
  return {
    name: pkg.name,
    description: pkg.description ?? "",
    basePrice: pkg.basePrice,
    entityType: pkg.entityType,
    includedWarehouseCount: pkg.includedWarehouseCount ?? undefined,
    includedStoreCount: pkg.includedStoreCount ?? undefined,
  };
}

export function PackageFormDialog({
  pkg,
  open,
  onOpenChange,
  onSaved,
}: PackageFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();
  const isEdit = pkg !== null;

  const form = useForm<FormValues>({
    resolver: zodResolver(CreatePackageSchema),
    defaultValues: pkg ? valuesFromPackage(pkg) : emptyValues(),
  });

  useEffect(() => {
    if (!open) {
      form.reset(emptyValues());
      setError("");
      return;
    }
    form.reset(pkg ? valuesFromPackage(pkg) : emptyValues());
  }, [open, pkg, form]);

  const onSubmit = (values: FormValues) => {
    setError("");
    startTransition(async () => {
      const result = pkg
        ? await updatePackage(pkg.id, values)
        : await createPackage(values);
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit package" : "New package"}</DialogTitle>
          <DialogDescription>
            Packages drive subscription pricing. Editing a package updates
            future renewal prices but does not retroactively change existing
            subscriptions.
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
                    <Input placeholder="Pro Plan" disabled={isPending} {...field} />
                  </FormControl>
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
                      placeholder="What this package includes"
                      disabled={isPending}
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        disabled={isPending}
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value || 0))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ENTITY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.charAt(0) + t.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="includedWarehouseCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Included warehouses</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        disabled={isPending}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
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
                name="includedStoreCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Included stores</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        disabled={isPending}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  "Create package"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
