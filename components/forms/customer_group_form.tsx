"use client";

import React, { useCallback, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { CustomerGroup } from "@/types/customer/type";
import { CustomerGroupSchema } from "@/types/customer/schema";
import {
  createCustomerGroup,
  updateCustomerGroup,
} from "@/lib/actions/customer-actions";

type GroupFormValues = z.infer<typeof CustomerGroupSchema>;

export const GroupDialog = ({
  open,
  onOpenChange,
  editingGroup,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGroup: CustomerGroup | null;
  onSaved: () => void;
}) => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(CustomerGroupSchema),
    defaultValues: editingGroup
      ? {
          name: editingGroup.name,
          description: editingGroup.description ?? undefined,
          active: editingGroup.active,
        }
      : { name: "", description: undefined, active: true },
  });

  React.useEffect(() => {
    if (editingGroup) {
      form.reset({
        name: editingGroup.name,
        description: editingGroup.description ?? undefined,
        active: editingGroup.active,
      });
    } else {
      form.reset({ name: "", description: undefined, active: true });
    }
  }, [editingGroup, form]);

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.error("Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: "Please fill all the required fields",
    });
  }, []);

  const submitData = (values: GroupFormValues) => {
    startTransition(async () => {
      const action = editingGroup
        ? updateCustomerGroup(editingGroup.id, values)
        : createCustomerGroup(values);

      const data = await action;
      if (data) {
        if (data.responseType === "success") {
          toast({
            variant: "success",
            title: "Success",
            description: data.message,
          });
          onOpenChange(false);
          onSaved();
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.message,
          });
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {editingGroup ? "Edit Group" : "Create Customer Group"}
          </DialogTitle>
          <DialogDescription>
            {editingGroup
              ? "Update the group name"
              : "Create a new group to organize your customers"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitData, onInvalid)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., VIPs, Corporate, Regulars"
                      disabled={isPending}
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
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Optional description"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isPending
                  ? "Saving..."
                  : editingGroup
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
