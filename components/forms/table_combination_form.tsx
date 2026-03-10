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
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Combine,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  Space,
  TableCombination,
  BOOKABLE_TYPES,
  TABLE_SPACE_TYPE_LABELS,
} from "@/types/space/type";
import { TableCombinationSchema } from "@/types/space/schema";
import {
  createTableCombination,
  updateTableCombination,
  deleteTableCombination,
} from "@/lib/actions/space-actions";

type CombinationFormValues = z.infer<typeof TableCombinationSchema>;

const CombinationDialog = ({
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
        ? updateTableCombination(editingCombination.id, values)
        : createTableCombination(values);

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

const TableCombinationManager = ({
  combinations,
  allSpaces,
  onRefresh,
}: {
  combinations: TableCombination[];
  allSpaces: Space[];
  onRefresh: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCombination, setEditingCombination] =
    useState<TableCombination | null>(null);
  const [deletingId, setDeletingId] = useState<UUID | null>(null);

  const bookableTables = allSpaces.filter(
    (s) => BOOKABLE_TYPES.includes(s.type) && s.active,
  );

  const handleEdit = (combo: TableCombination) => {
    setEditingCombination(combo);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCombination(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: UUID) => {
    setDeletingId(id);
    try {
      await deleteTableCombination(id);
      toast({
        title: "Success",
        description: "Table combination deleted successfully",
      });
      onRefresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete table combination",
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
            <CardTitle className="text-lg">Table Combinations</CardTitle>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Combination
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {combinations.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <Combine className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No table combinations yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Group multiple tables together to seat larger parties
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleAdd}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add First Combination
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {combinations.map((combo) => (
                <div
                  key={combo.id}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{combo.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        Capacity: {combo.capacity}
                      </Badge>
                    </div>
                    {combo.tables && combo.tables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {combo.tables.map((table) => (
                          <Badge
                            key={table.id}
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {table.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(combo)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {combo.canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(combo.id)}
                        disabled={deletingId === combo.id}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        {deletingId === combo.id ? (
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

      <CombinationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCombination={editingCombination}
        bookableTables={bookableTables}
        onSaved={onRefresh}
      />
    </>
  );
};

export default TableCombinationManager;
