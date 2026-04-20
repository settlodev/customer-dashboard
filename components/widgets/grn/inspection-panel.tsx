"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import {
  GrnItem,
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_OPTIONS,
  INSPECTION_STATUS_TONES,
} from "@/types/grn/type";
import { RecordInspectionSchema } from "@/types/grn/schema";
import { recordInspection } from "@/lib/actions/grn-actions";

type FormValues = z.infer<typeof RecordInspectionSchema>;

interface Props {
  grnId: string;
  items: GrnItem[];
}

export function InspectionPanel({ grnId, items }: Props) {
  const [activeItem, setActiveItem] = useState<GrnItem | null>(null);

  const progress = items.reduce(
    (acc, item) => {
      if (item.inspectionStatus === "PENDING" || item.inspectionStatus == null) {
        acc.pending += 1;
      } else {
        acc.done += 1;
      }
      return acc;
    },
    { done: 0, pending: 0 },
  );

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Inspection
            </h3>
            <p className="text-xs text-muted-foreground">
              Record inspection per item. When you receive the GRN, only passed
              and partially-passed items will enter inventory.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {progress.done} / {items.length} inspected
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/60">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Received</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Inspected</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Rejected</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => {
                const status = item.inspectionStatus ?? "PENDING";
                return (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-medium">{item.variantName}</td>
                    <td className="px-3 py-2 text-right">
                      {Number(item.receivedQuantity).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {item.inspectedQuantity != null
                        ? Number(item.inspectedQuantity).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {item.rejectedQuantity != null
                        ? Number(item.rejectedQuantity).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${INSPECTION_STATUS_TONES[status]}`}
                      >
                        {INSPECTION_STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveItem(item)}
                      >
                        {status === "PENDING" ? "Inspect" : "Update"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>

      {activeItem && (
        <InspectionDialog
          key={activeItem.id}
          grnId={grnId}
          item={activeItem}
          onClose={() => setActiveItem(null)}
        />
      )}
    </Card>
  );
}

function InspectionDialog({
  grnId,
  item,
  onClose,
}: {
  grnId: string;
  item: GrnItem;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(RecordInspectionSchema),
    defaultValues: {
      inspectionStatus:
        item.inspectionStatus && item.inspectionStatus !== "PENDING"
          ? item.inspectionStatus
          : "PASSED",
      inspectedQuantity:
        item.inspectedQuantity != null
          ? Number(item.inspectedQuantity)
          : Number(item.receivedQuantity),
      rejectedQuantity:
        item.rejectedQuantity != null ? Number(item.rejectedQuantity) : 0,
    },
  });

  const status = form.watch("inspectionStatus");

  const onSubmit = (values: FormValues) => {
    startTransition(() => {
      recordInspection(grnId, item.id, values).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't record inspection",
            description: res.message,
          });
          return;
        }
        toast({ title: "Inspection recorded", description: res.message });
        router.refresh();
        onClose();
      });
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inspect {item.variantName}</DialogTitle>
          <DialogDescription>
            Received {Number(item.receivedQuantity).toLocaleString()} units.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inspectionStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INSPECTION_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            {status === "PARTIAL" && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="inspectedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspected</FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          value={field.value}
                          onValueChange={(v) =>
                            field.onChange(v.value ? Number(v.value) : 0)
                          }
                          thousandSeparator
                          decimalScale={6}
                          allowNegative={false}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rejectedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rejected</FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          value={field.value}
                          onValueChange={(v) =>
                            field.onChange(v.value ? Number(v.value) : 0)
                          }
                          thousandSeparator
                          decimalScale={6}
                          allowNegative={false}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
