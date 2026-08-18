"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
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
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { updateAdminWarehouse } from "@/lib/actions/admin/businesses";
import { UpdateWarehouseSchema } from "@/types/admin/schemas";
import { AdminWarehouseDetail } from "@/types/admin/business";

type FormValues = z.infer<typeof UpdateWarehouseSchema>;

function valuesFrom(w: AdminWarehouseDetail): FormValues {
  // `capacity` / `primary` are intentionally omitted from this form (primary
  // has cross-warehouse side effects) — so they are never sent and stay as-is.
  return {
    name: w.name ?? "",
    description: w.description ?? "",
    code: w.code ?? "",
  };
}

interface EditWarehouseDialogProps {
  warehouse: AdminWarehouseDetail;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function EditWarehouseDialog({
  warehouse,
  open,
  onOpenChange,
}: EditWarehouseDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(UpdateWarehouseSchema),
    defaultValues: valuesFrom(warehouse),
  });

  useEffect(() => {
    if (open) {
      form.reset(valuesFrom(warehouse));
      setError("");
    }
  }, [open, warehouse, form]);

  const onSubmit = (values: FormValues) => {
    setError("");
    startTransition(async () => {
      const res = await updateAdminWarehouse(warehouse.id, values);
      if (res.responseType === "error") {
        setError(res.message);
        return;
      }
      toast({ title: "Warehouse updated", description: res.message });
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit warehouse</DialogTitle>
          <DialogDescription>
            Update this warehouse&apos;s details on behalf of its owner.
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
                    <Input disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      className="font-mono"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      disabled={isPending}
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
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Self-contained trigger — safe to drop into a server-rendered header.
export function EditWarehouseButton({
  warehouse,
}: {
  warehouse: AdminWarehouseDetail;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
      <EditWarehouseDialog
        warehouse={warehouse}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
