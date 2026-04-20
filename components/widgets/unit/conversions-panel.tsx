"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Loader2, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { NumericFormat } from "react-number-format";
import {
  createConversion,
  deleteConversion,
  updateConversion,
} from "@/lib/actions/unit-actions";
import {
  UnitConversionSchema,
  type UnitConversion,
  type UnitConversionPayload,
  type UnitOfMeasure,
} from "@/types/unit/type";

interface Props {
  /** The "from" unit the panel is anchored to. */
  unit: UnitOfMeasure;
  /** All UoMs the user can see (for the to-unit picker). */
  allUnits: UnitOfMeasure[];
  /** Existing conversions scoped to this unit as "from". */
  conversions: UnitConversion[];
}

/**
 * Inline conversion management for a single UoM detail page. Only shows
 * add/edit/delete buttons for conversions the user actually owns — seeded
 * system conversions are rendered but locked.
 */
export function ConversionsPanel({ unit, allUnits, conversions }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UnitConversion | null>(null);
  const [editMultiplier, setEditMultiplier] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<UnitConversion | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const openEdit = (row: UnitConversion) => {
    if (row.systemGenerated) return;
    setEditing(row);
    setEditMultiplier(String(row.multiplier));
  };

  const saveEdit = () => {
    if (!editing) return;
    const parsed = Number(editMultiplier);
    if (!parsed || Number.isNaN(parsed) || parsed <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid multiplier",
        description: "Multiplier must be a positive number.",
      });
      return;
    }
    startTransition(async () => {
      const res = await updateConversion(editing.id, parsed, unit.id);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Saved", description: res.message });
        setEditing(null);
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  const onDelete = () => {
    if (!confirmDelete) return;
    startTransition(async () => {
      const res = await deleteConversion(confirmDelete.id, unit.id);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Removed", description: res.message });
        setConfirmDelete(null);
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Conversions from {unit.abbreviation}</h3>
            <p className="text-xs text-muted-foreground">
              Define how {unit.abbreviation} converts to other units.
              Multipliers are applied as{" "}
              <code className="px-1 py-0.5 rounded bg-muted text-[11px]">qty × multiplier</code>.
              {unit.systemGenerated &&
                " Any conversion you add here is a custom conversion owned by your business — the system unit itself stays locked."}
            </p>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add conversion
          </Button>
        </div>

        {conversions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No conversions defined yet.
          </p>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead />
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Multiplier</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-[110px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversions.map((c) => {
                  const isEditing = editing?.id === c.id;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        1 {c.fromUnitAbbreviation}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <ArrowRight className="h-4 w-4" />
                      </TableCell>
                      <TableCell className="text-sm">{c.toUnitAbbreviation}</TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        {isEditing ? (
                          <NumericFormat
                            customInput={Input}
                            value={editMultiplier}
                            onValueChange={(v) => setEditMultiplier(v.value)}
                            thousandSeparator
                            decimalScale={10}
                            allowNegative={false}
                            className="h-8 w-[120px] ml-auto text-right"
                            disabled={isPending}
                          />
                        ) : (
                          Number(c.multiplier).toLocaleString(undefined, {
                            maximumFractionDigits: 10,
                          })
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.systemGenerated ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            <ShieldCheck className="h-3 w-3" />
                            System
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            Custom
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.systemGenerated ? (
                          <span className="text-[11px] text-muted-foreground">
                            Locked
                          </span>
                        ) : isEditing ? (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-emerald-600"
                              onClick={saveEdit}
                              disabled={isPending}
                            >
                              {isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setEditing(null)}
                              disabled={isPending}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-600 hover:text-red-600"
                              onClick={() => setConfirmDelete(c)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AddConversionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fromUnit={unit}
        allUnits={allUnits}
      />

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove conversion?</DialogTitle>
            <DialogDescription>
              Removes{" "}
              <strong>
                {confirmDelete?.fromUnitAbbreviation} → {confirmDelete?.toUnitAbbreviation}
              </strong>
              . Code that relies on this conversion will fall back to the
              system conversion if one exists.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AddConversionDialog({
  open,
  onOpenChange,
  fromUnit,
  allUnits,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  fromUnit: UnitOfMeasure;
  allUnits: UnitOfMeasure[];
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  // Same unit type only — converting kg→ml is a category error.
  const candidateUnits = useMemo(
    () =>
      allUnits.filter(
        (u) =>
          u.id !== fromUnit.id &&
          u.unitType === fromUnit.unitType &&
          !u.archivedAt,
      ),
    [allUnits, fromUnit],
  );

  const form = useForm<UnitConversionPayload>({
    resolver: zodResolver(UnitConversionSchema),
    defaultValues: {
      fromUnitId: fromUnit.id,
      toUnitId: "",
      multiplier: "",
    },
    values: {
      fromUnitId: fromUnit.id,
      toUnitId: "",
      multiplier: "",
    },
  });

  const submit = (values: UnitConversionPayload) => {
    startTransition(async () => {
      const res = await createConversion(values);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Saved", description: res.message });
        onOpenChange(false);
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add conversion</DialogTitle>
          <DialogDescription>
            Define how 1 {fromUnit.abbreviation} converts to another{" "}
            {fromUnit.unitType.toLowerCase()} unit.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toUnitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To unit</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {candidateUnits.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No other {fromUnit.unitType.toLowerCase()} units
                          available.
                        </div>
                      ) : (
                        candidateUnits.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.abbreviation})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="multiplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Multiplier (1 {fromUnit.abbreviation} = ? target)
                  </FormLabel>
                  <FormControl>
                    <NumericFormat
                      customInput={Input}
                      value={field.value}
                      onValueChange={(v) => field.onChange(v.value)}
                      thousandSeparator
                      decimalScale={10}
                      allowNegative={false}
                      placeholder="e.g. 1000"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
