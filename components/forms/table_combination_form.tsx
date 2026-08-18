"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
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
import { Loader2, Search, X } from "lucide-react";
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

const SEARCH_THRESHOLD = 8;
const EMPTY_IDS: string[] = [];

const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function suggestName(selectedTables: Space[]): string {
  if (selectedTables.length === 0) return "";
  const codes = selectedTables.map((t) => t.code || t.name);
  const joined = `Tables ${codes.join(" + ")}`;
  if (joined.length <= 80) return joined;
  return `${selectedTables.length} tables combined`;
}

function calcCapacity(tableIds: string[], pool: Space[]): number {
  const set = new Set(tableIds);
  return pool
    .filter((t) => set.has(t.id as string))
    .reduce((sum, t) => sum + t.capacity, 0);
}

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
  const [search, setSearch] = useState("");
  const nameTouchedRef = useRef(false);
  const editingId = editingCombination?.id ?? null;

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
          capacity: 1,
          tableIds: [],
        },
  });

  useEffect(() => {
    if (!open) return;
    if (editingCombination) {
      form.reset({
        name: editingCombination.name,
        capacity: editingCombination.capacity,
        tableIds: editingCombination.tables.map((t) => t.id as string),
      });
      nameTouchedRef.current = true;
    } else {
      form.reset({ name: "", capacity: 1, tableIds: [] });
      nameTouchedRef.current = false;
    }
    setSearch("");
    // form ref is stable; we intentionally key off the editingCombination id
    // so a new edit target re-runs the reset, but a parent re-render passing
    // the same record (new object ref, same id) does not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  const selectedTableIds = form.watch("tableIds") ?? EMPTY_IDS;

  const sortedTables = useMemo(() => {
    return [...bookableTables].sort((a, b) => {
      const ac = a.code ?? "";
      const bc = b.code ?? "";
      const cmp = naturalCollator.compare(ac, bc);
      if (cmp !== 0) return cmp;
      return naturalCollator.compare(a.name, b.name);
    });
  }, [bookableTables]);

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedTables;
    return sortedTables.filter((t) => {
      const code = (t.code ?? "").toLowerCase();
      const name = t.name.toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [sortedTables, search]);

  const selectedTables = useMemo(() => {
    const set = new Set(selectedTableIds);
    return sortedTables.filter((t) => set.has(t.id as string));
  }, [sortedTables, selectedTableIds]);

  const totalCapacity = useMemo(
    () => selectedTables.reduce((sum, t) => sum + t.capacity, 0),
    [selectedTables],
  );

  const setSelection = useCallback(
    (newIds: string[]) => {
      form.setValue("tableIds", newIds);
      if (!nameTouchedRef.current) {
        const set = new Set(newIds);
        const selected = bookableTables.filter((t) =>
          set.has(t.id as string),
        );
        form.setValue("name", suggestName(selected));
      }
    },
    [bookableTables, form],
  );

  const toggleTable = useCallback(
    (tableId: string) => {
      const current = form.getValues("tableIds") || [];
      const next = current.includes(tableId)
        ? current.filter((id) => id !== tableId)
        : [...current, tableId];
      setSelection(next);
    },
    [form, setSelection],
  );

  const selectAllVisible = useCallback(() => {
    const current = new Set(form.getValues("tableIds") || []);
    filteredTables.forEach((t) => current.add(t.id as string));
    setSelection([...current]);
  }, [filteredTables, form, setSelection]);

  const clearAll = useCallback(() => {
    setSelection([]);
  }, [setSelection]);

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.error("Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: "Please fill all the required fields",
    });
  }, []);

  const submitData = (values: CombinationFormValues) => {
    const computedCapacity = calcCapacity(values.tableIds, bookableTables);
    if (computedCapacity <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Selected tables have no capacity",
      });
      return;
    }
    const finalValues: CombinationFormValues = {
      ...values,
      capacity: computedCapacity,
    };

    startTransition(async () => {
      const action = editingCombination
        ? updateTableCombination(
            editingCombination.id,
            finalValues,
            editingCombination.version,
          )
        : createTableCombination(finalValues);

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

  const showSearch = bookableTables.length > SEARCH_THRESHOLD;
  const allVisibleSelected =
    filteredTables.length > 0 &&
    filteredTables.every((t) => selectedTableIds.includes(t.id as string));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>
            {editingCombination
              ? "Edit table combination"
              : "Create table combination"}
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Tables C1 + C2"
                      disabled={isPending}
                      onChange={(e) => {
                        nameTouchedRef.current = true;
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tableIds"
              render={() => (
                <FormItem className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Tables to combine</FormLabel>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={selectAllVisible}
                        disabled={
                          isPending ||
                          allVisibleSelected ||
                          filteredTables.length === 0
                        }
                        className="text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                      >
                        Select all{search ? " visible" : ""}
                      </button>
                      <span className="text-muted-foreground">·</span>
                      <button
                        type="button"
                        onClick={clearAll}
                        disabled={isPending || selectedTableIds.length === 0}
                        className="text-muted-foreground hover:underline disabled:opacity-40 disabled:no-underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {showSearch && (
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or code..."
                        className="pl-8"
                        disabled={isPending}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-2 text-xs">
                    <span className="font-medium">
                      {selectedTableIds.length} selected
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {totalCapacity}{" "}
                      {totalCapacity === 1 ? "seat" : "seats"} total
                    </span>
                    {selectedTables.length > 0 && (
                      <div className="flex flex-wrap gap-1 pl-1">
                        {selectedTables.map((t) => (
                          <Badge
                            key={t.id}
                            variant="secondary"
                            className="gap-1 py-0.5 pl-2 pr-1 font-normal"
                          >
                            <span>{t.code || t.name}</span>
                            <button
                              type="button"
                              onClick={() => toggleTable(t.id as string)}
                              disabled={isPending}
                              className="rounded-sm p-0.5 hover:bg-background/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                              aria-label={`Remove ${t.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <ScrollArea className="h-[220px] rounded-lg border p-3">
                    {bookableTables.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No bookable tables available
                      </p>
                    ) : filteredTables.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No tables match &ldquo;{search}&rdquo;
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filteredTables.map((table) => {
                          const isSelected = selectedTableIds.includes(
                            table.id as string,
                          );
                          return (
                            <div
                              key={table.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleTable(table.id as string)}
                              onKeyDown={(e) => {
                                if (e.key === " " || e.key === "Enter") {
                                  e.preventDefault();
                                  toggleTable(table.id as string);
                                }
                              }}
                              className={`flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors ${
                                isSelected
                                  ? "border border-emerald-200 bg-emerald-50"
                                  : "border border-transparent hover:bg-gray-50"
                              }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                disabled={isPending}
                                tabIndex={-1}
                                aria-hidden
                                className="pointer-events-none"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-medium">
                                  {table.name}
                                </span>
                                {table.code && (
                                  <span className="ml-1 text-xs text-muted-foreground">
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
