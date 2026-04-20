"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Money } from "@/components/widgets/money";
import { AddLandedCostSchema } from "@/types/grn/schema";
import {
  LANDED_COST_TYPE_OPTIONS,
  LandedCost,
} from "@/types/grn/type";
import { addLandedCost } from "@/lib/actions/grn-actions";

type FormValues = z.infer<typeof AddLandedCostSchema>;

interface Props {
  grnId: string;
  costs: LandedCost[];
  currency: string;
  disabled?: boolean;
}

export function LandedCostsPanel({ grnId, costs, currency, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(AddLandedCostSchema),
    defaultValues: {
      costType: "FREIGHT",
      amount: 0,
      description: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(() => {
      addLandedCost(grnId, values).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't add landed cost",
            description: res.message,
          });
          return;
        }
        toast({ title: "Landed cost added", description: res.message });
        form.reset({ costType: "FREIGHT", amount: 0, description: "" });
        setOpen(false);
      });
    });
  };

  const total = costs.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium">Landed Costs</h3>
            <p className="text-xs text-muted-foreground">
              Freight, customs, insurance and handling charges are distributed
              proportionally across line items. Adding a cost updates batch
              and inventory unit costs automatically.
            </p>
          </div>
          {!disabled && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Cost
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Landed Cost</DialogTitle>
                  <DialogDescription>
                    Amount in the location currency ({currency}).
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="costType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
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
                              {LANDED_COST_TYPE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ({currency})</FormLabel>
                          <FormControl>
                            <NumericFormat
                              customInput={Input}
                              value={field.value}
                              onValueChange={(v) =>
                                field.onChange(v.value ? Number(v.value) : 0)
                              }
                              thousandSeparator
                              decimalScale={4}
                              placeholder="0.00"
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
                              rows={3}
                              placeholder="Optional — invoice ref, carrier, etc."
                              {...field}
                              value={field.value ?? ""}
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        {isPending && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Save
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {costs.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No landed costs recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Description</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {costs.map((c) => {
                  const label =
                    LANDED_COST_TYPE_OPTIONS.find((o) => o.value === c.costType)?.label ??
                    c.costType;
                  return (
                    <tr key={c.id}>
                      <td className="px-3 py-2 font-medium">{label}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {c.description || "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        <Money amount={Number(c.amount)} currency={c.currency || currency} />
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50/60 font-semibold">
                  <td colSpan={2} className="px-3 py-2 text-right">Total</td>
                  <td className="px-3 py-2 text-right">
                    <Money amount={total} currency={currency} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
