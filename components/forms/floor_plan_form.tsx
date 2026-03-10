"use client";

import React, { useCallback, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";
import { UUID } from "node:crypto";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, LayoutGrid } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { FloorPlan } from "@/types/space/type";
import { FloorPlanSchema } from "@/types/space/schema";
import {
  createFloorPlan,
  updateFloorPlan,
  deleteFloorPlan,
} from "@/lib/actions/space-actions";

type FloorPlanFormValues = z.infer<typeof FloorPlanSchema>;

const FloorPlanDialog = ({
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
        ? updateFloorPlan(editingPlan.id, values)
        : createFloorPlan(values);

      const data = await action;
      if (data) {
        if (data.responseType === "success") {
          toast({ title: "Success", description: data.message });
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

const FloorPlanManager = ({
  floorPlans,
  onRefresh,
}: {
  floorPlans: FloorPlan[];
  onRefresh: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FloorPlan | null>(null);
  const [deletingId, setDeletingId] = useState<UUID | null>(null);

  const handleEdit = (plan: FloorPlan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: UUID) => {
    setDeletingId(id);
    try {
      await deleteFloorPlan(id);
      toast({
        title: "Success",
        description: "Floor plan deleted successfully",
      });
      onRefresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete floor plan",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Floor Plans</CardTitle>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Floor Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {floorPlans.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <LayoutGrid className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No floor plans yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create floor plans to organize your tables visually
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleAdd}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add First Floor Plan
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {floorPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plan.name}</span>
                      {plan.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {plan.description}
                      </p>
                    )}
                    {(plan.width || plan.height) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.width} × {plan.height} px
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(plan)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {plan.canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(plan.id)}
                        disabled={deletingId === plan.id}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        {deletingId === plan.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FloorPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingPlan={editingPlan}
        onSaved={onRefresh}
      />
    </>
  );
};

export default FloorPlanManager;
