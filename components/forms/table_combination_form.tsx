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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  Space,
  TableCombination,
  TABLE_SPACE_TYPE_LABELS,
} from "@/types/space/type";
import { TableCombinationSchema } from "@/types/space/schema";
import {
  createTableCombination,
  updateTableCombination,
} from "@/lib/actions/space-actions";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";

type CombinationFormValues = z.infer<typeof TableCombinationSchema>;

export const CombinationDialog = ({
  open,
  onOpenChange,
  editingCombination,
  bookableTables,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCombination: TableCombination | null;
  bookableTables: Space[];
  onSaved: () => void;
}) => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CombinationFormValues>({
    resolver: zodResolver(TableCombinationSchema),
    defaultValues: editingCombination
      ? {
          name: editingCombination.name,
          capacity: editingCombination.capacity,
          tableIds: editingCombination.tables.map((t) => t.id as string),
        }
      : {
          name: "",
          capacity: 0,
          tableIds: [],
        },
  });

  React.useEffect(() => {
    if (editingCombination) {
      form.reset({
        name: editingCombination.name,
        capacity: editingCombination.capacity,
        tableIds: editingCombination.tables.map((t) => t.id as string),
      });
    } else {
      form.reset({ name: "", capacity: 0, tableIds: [] });
    }
  }, [editingCombination, form]);

  const selectedTableIds = form.watch("tableIds");

  React.useEffect(() => {
    if (selectedTableIds && selectedTableIds.length > 0) {
      const totalCapacity = bookableTables
        .filter((t) => selectedTableIds.includes(t.id as string))
        .reduce((sum, t) => sum + t.capacity, 0);
      form.setValue("capacity", totalCapacity);
    }
  }, [selectedTableIds, bookableTables, form]);

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.error("Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: "Please fill all the required fields",
    });
  }, []);

  const submitData = (values: CombinationFormValues) => {
    startTransition(async () => {
      const action = editingCombination
        ? updateTableCombination(
            editingCombination.id,
            values,
            editingCombination.version,
          )
        : createTableCombination(values);

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
              "Failed to save table combination",
            ),
          });
        }
      }
    });
  };

  const toggleTable = (tableId: string) => {
    const current = form.getValues("tableIds") || [];
    if (current.includes(tableId)) {
      form.setValue(
        "tableIds",
        current.filter((id) => id !== tableId),
        { shouldValidate: true },
      );
    } else {
      form.setValue("tableIds", [...current, tableId], {
        shouldValidate: true,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingCombination
              ? "Edit Table Combination"
              : "Create Table Combination"}
          </DialogTitle>
          <DialogDescription>
            {editingCombination
              ? "Update the table combination"
              : "Group tables together for large parties"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitData, onInvalid)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Tables C1+C2"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        disabled
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
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
              name="tableIds"
              render={() => (
                <FormItem>
                  <FormLabel>Select Tables</FormLabel>
                  <ScrollArea className="h-[200px] border rounded-lg p-3">
                    {bookableTables.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No bookable tables available
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {bookableTables.map((table) => {
                          const isSelected = selectedTableIds?.includes(
                            table.id as string,
                          );
                          return (
                            <div
                              key={table.id}
                              className={`flex items-center gap-3 rounded-md p-2 cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-emerald-50 border border-emerald-200"
                                  : "hover:bg-gray-50 border border-transparent"
                              }`}
                              onClick={() => toggleTable(table.id as string)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  toggleTable(table.id as string)
                                }
                                disabled={isPending}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium">
                                  {table.name}
                                </span>
                                {table.code && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({table.code})
                                  </span>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {TABLE_SPACE_TYPE_LABELS[table.type]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Cap: {table.capacity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
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
                  : editingCombination
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
