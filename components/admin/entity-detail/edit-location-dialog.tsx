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

import { updateAdminLocation } from "@/lib/actions/admin/businesses";
import { UpdateLocationSchema } from "@/types/admin/schemas";
import { AdminLocationDetail } from "@/types/admin/business";

type FormValues = z.infer<typeof UpdateLocationSchema>;

function valuesFrom(l: AdminLocationDetail): FormValues {
  return {
    name: l.name ?? "",
    description: l.description ?? "",
    phoneNumber: l.phoneNumber ?? "",
    email: l.email ?? "",
    region: l.region ?? "",
    district: l.district ?? "",
    ward: l.ward ?? "",
    address: l.address ?? "",
    postalCode: l.postalCode ?? "",
    timezone: l.timezone ?? "",
  };
}

interface EditLocationDialogProps {
  location: AdminLocationDetail;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function EditLocationDialog({
  location,
  open,
  onOpenChange,
}: EditLocationDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(UpdateLocationSchema),
    defaultValues: valuesFrom(location),
  });

  useEffect(() => {
    if (open) {
      form.reset(valuesFrom(location));
      setError("");
    }
  }, [open, location, form]);

  const onSubmit = (values: FormValues) => {
    setError("");
    startTransition(async () => {
      const res = await updateAdminLocation(location.id, values);
      if (res.responseType === "error") {
        setError(res.message);
        return;
      }
      toast({ title: "Location updated", description: res.message });
      onOpenChange(false);
      router.refresh();
    });
  };

  const text = (name: keyof FormValues, label: string, mono = false) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              disabled={isPending}
              className={mono ? "font-mono" : undefined}
              {...field}
              value={field.value ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit location</DialogTitle>
          <DialogDescription>
            Update this location&apos;s details on behalf of its owner.
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
            {text("name", "Name")}
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
            <div className="grid grid-cols-2 gap-4">
              {text("phoneNumber", "Phone", true)}
              {text("email", "Email", true)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {text("region", "Region")}
              {text("district", "District")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {text("ward", "Ward")}
              {text("postalCode", "Postal code", true)}
            </div>
            {text("address", "Address")}
            {text("timezone", "Timezone (IANA)", true)}

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
export function EditLocationButton({
  location,
}: {
  location: AdminLocationDetail;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
      <EditLocationDialog
        location={location}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
