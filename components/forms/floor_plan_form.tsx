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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { FloorPlan } from "@/types/space/type";
import { FloorPlanSchema } from "@/types/space/schema";
import {
  createFloorPlan,
  updateFloorPlan,
} from "@/lib/actions/space-actions";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";

type FloorPlanFormValues = z.infer<typeof FloorPlanSchema>;

export const FloorPlanDialog = ({
  open,
  onOpenChange,
  editingPlan,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlan: FloorPlan | null;
  onSaved: () => void;
}) => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FloorPlanFormValues>({
    resolver: zodResolver(FloorPlanSchema),
    defaultValues: editingPlan
      ? {
          name: editingPlan.name,
          description: editingPlan.description ?? undefined,
          width: editingPlan.width ?? undefined,
          height: editingPlan.height ?? undefined,
          isDefault: editingPlan.isDefault,
        }
      : {
          name: "",
          isDefault: false,
        },
  });

  React.useEffect(() => {
    if (editingPlan) {
      form.reset({
        name: editingPlan.name,
        description: editingPlan.description ?? undefined,
        width: editingPlan.width ?? undefined,
        height: editingPlan.height ?? undefined,
        isDefault: editingPlan.isDefault,
      });
    } else {
      form.reset({ name: "", isDefault: false });
    }
  }, [editingPlan, form]);

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.error("Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: "Please fill all the required fields",
    });
  }, []);

  const submitData = (values: FloorPlanFormValues) => {
    startTransition(async () => {
      const action = editingPlan
        ? updateFloorPlan(editingPlan.id, values, editingPlan.version)
        : createFloorPlan(values);

      const data = await action;
      if (data) {
        if (data.responseType === "success") {
          toast({
            variant: "success",
            title: "Success",
            description: SettloErrorHandler.safeMessage(data.message),
          });
          onOpenChange(false);
          onSaved();
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: SettloErrorHandler.safeMessage(
              data.message,
              "Failed to save floor plan",
            ),
          });
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {editingPlan ? "Edit Floor Plan" : "Add Floor Plan"}
          </DialogTitle>
          <DialogDescription>
            {editingPlan
              ? "Update floor plan details"
              : "Create a new floor plan for your location"}
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
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Ground Floor, Rooftop"
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
                    <Textarea
                      {...field}
                      placeholder="Optional description..."
                      disabled={isPending}
                      rows={2}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="px"
                        min={1}
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value),
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
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="px"
                        min={1}
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">
                    Default floor plan
                  </FormLabel>
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
                  : editingPlan
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
