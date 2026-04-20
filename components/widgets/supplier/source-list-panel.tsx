"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import {
  createSourceList,
  deleteSourceList,
  updateSourceList,
} from "@/lib/actions/supplier-source-list-actions";
import {
  SupplierSourceListSchema,
  type SupplierSourceList,
  type SupplierSourceListPayload,
} from "@/types/supplier-source-list/type";

interface Props {
  supplierId: string;
  entries: SupplierSourceList[];
}

/**
 * Source-list panel: variants sourced from this supplier, with their priority
 * and fixed-source flag. Priority 1 = preferred; fixed-source overrides
 * auto-reorder and pins this supplier for that variant.
 */
export function SupplierSourceListPanel({ supplierId, entries }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierSourceList | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SupplierSourceList | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onDelete = () => {
    if (!confirmDelete) return;
    startTransition(async () => {
      const res = await deleteSourceList(confirmDelete.id, supplierId);
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
            <h3 className="text-sm font-semibold">Source list</h3>
            <p className="text-xs text-muted-foreground">
              Variants this supplier is approved to supply. Priority 1 is
              preferred; fixed-source pins this supplier regardless of
              pricing.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add variant
          </Button>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            This supplier isn&apos;t on the source list for any variant.
          </p>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                  <TableHead>Fixed source</TableHead>
                  <TableHead>Valid</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm font-medium">
                      {e.stockVariantName || e.stockName || e.stockVariantId}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          e.priority === 1
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {e.priority === 1 && <Star className="h-3 w-3" />}
                        {e.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {e.isFixedSource ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                          Fixed
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.validFrom || e.validTo
                        ? `${e.validFrom ?? "—"} → ${e.validTo ?? "open"}`
                        : "Always"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditing(e);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:text-red-600"
                          onClick={() => setConfirmDelete(e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <SourceListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplierId={supplierId}
        editing={editing}
      />

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove from source list?</DialogTitle>
            <DialogDescription>
              This supplier will no longer be a valid source for{" "}
              <strong>
                {confirmDelete?.stockVariantName || confirmDelete?.stockVariantId}
              </strong>
              .
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

function SourceListDialog({
  open,
  onOpenChange,
  supplierId,
  editing,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  supplierId: string;
  editing: SupplierSourceList | null;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SupplierSourceListPayload>({
    resolver: zodResolver(SupplierSourceListSchema),
    values: {
      stockVariantId: editing?.stockVariantId ?? "",
      supplierId,
      priority: editing?.priority ?? 1,
      isFixedSource: editing?.isFixedSource ?? false,
      validFrom: editing?.validFrom ?? "",
      validTo: editing?.validTo ?? "",
      notes: editing?.notes ?? "",
    },
  });

  const submit = (values: SupplierSourceListPayload) => {
    startTransition(async () => {
      const res = editing
        ? await updateSourceList(editing.id, values)
        : await createSourceList(values);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit source entry" : "Add variant to source list"}</DialogTitle>
          <DialogDescription>
            Priority 1 is the preferred supplier. Tick &quot;fixed source&quot;
            to override auto-reorder for this variant.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stockVariantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock variant</FormLabel>
                  <FormControl>
                    <StockVariantSelector
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      isDisabled={isPending || !!editing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Math.max(1, Number(e.target.value) || 1))
                        }
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      Lower is better. Use 1 for preferred.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isFixedSource"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel>Fixed source</FormLabel>
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                      <span className="text-xs text-muted-foreground">
                        Always pick this supplier
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid from</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid to</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
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
                {editing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
