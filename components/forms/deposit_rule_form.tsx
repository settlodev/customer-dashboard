"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Globe,
  Clock,
  LayoutGrid,
  Combine,
  Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  DepositRule,
  DepositRuleScope,
  DEPOSIT_RULE_SCOPE_LABELS,
} from "@/types/deposit-rule/type";
import { DepositRuleSchema } from "@/types/deposit-rule/schema";
import {
  createDepositRule,
  updateDepositRule,
  deleteDepositRule,
} from "@/lib/actions/deposit-rule-actions";
import {
  ReservationSlot,
  DAY_OF_WEEK_LABELS,
} from "@/types/reservation/type";
import { Space, BOOKABLE_TYPES } from "@/types/space/type";
import { fetchAllSpaces } from "@/lib/actions/space-actions";
import { fetchReservationSlots } from "@/lib/actions/reservation-actions";

interface Props {
  rules: DepositRule[];
  onRefresh: () => void;
}

const SCOPE_ORDER: DepositRuleScope[] = [
  "GLOBAL",
  "SLOT",
  "TABLE",
  "TABLE_SLOT",
];

const ScopeIcon = ({ scope }: { scope: DepositRuleScope }) => {
  switch (scope) {
    case "GLOBAL":
      return <Globe className="h-3.5 w-3.5" />;
    case "SLOT":
      return <Clock className="h-3.5 w-3.5" />;
    case "TABLE":
      return <LayoutGrid className="h-3.5 w-3.5" />;
    case "TABLE_SLOT":
      return <Combine className="h-3.5 w-3.5" />;
  }
};

const formatSlotLabel = (rule: DepositRule) => {
  if (!rule.reservationSlotDayOfWeek) return "Slot";
  const day = DAY_OF_WEEK_LABELS[rule.reservationSlotDayOfWeek] || rule.reservationSlotDayOfWeek;
  const start = rule.reservationSlotStartTime?.substring(0, 5) || "";
  const end = rule.reservationSlotEndTime?.substring(0, 5) || "";
  return `${day} ${start}–${end}`;
};

const DepositRuleManager = ({ rules, onRefresh }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DepositRule | null>(null);

  const handleAdd = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  const handleEdit = (rule: DepositRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleDelete = async (id: UUID) => {
    try {
      await deleteDepositRule(id);
      toast({
        variant: "success",
        title: "Success",
        description: "Deposit rule deleted successfully",
      });
      onRefresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete deposit rule",
      });
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingRule(null);
    onRefresh();
  };

  const grouped = SCOPE_ORDER.reduce(
    (acc, scope) => {
      acc[scope] = rules.filter((r) => r.scope === scope);
      return acc;
    },
    {} as Record<DepositRuleScope, DepositRule[]>,
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Deposit Rules</CardTitle>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Priority info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Priority order:</strong> Table + Slot (most specific)
              &rarr; Table &rarr; Slot &rarr; Global. Parent space rules apply
              to child tables without their own rule.
            </span>
          </div>

          {rules.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No deposit rules configured
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add rules to require deposits for reservations
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleAdd}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add First Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {SCOPE_ORDER.map((scope) => {
                const scopeRules = grouped[scope];
                if (!scopeRules || scopeRules.length === 0) return null;
                return (
                  <div key={scope} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ScopeIcon scope={scope} />
                      <p className="text-sm font-medium text-muted-foreground">
                        {DEPOSIT_RULE_SCOPE_LABELS[scope]}
                      </p>
                    </div>
                    {scopeRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-start justify-between gap-4 rounded-lg border p-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {rule.scope === "GLOBAL" && "Default Deposit"}
                              {rule.scope === "SLOT" && formatSlotLabel(rule)}
                              {rule.scope === "TABLE" &&
                                (rule.tableAndSpaceName || "Table Rule")}
                              {rule.scope === "TABLE_SLOT" && (
                                <>
                                  {rule.tableAndSpaceName || "Table"}
                                  {" · "}
                                  {formatSlotLabel(rule)}
                                </>
                              )}
                            </span>
                            <Badge
                              variant={
                                rule.requireDeposit ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {rule.requireDeposit ? "Required" : "No Deposit"}
                            </Badge>
                          </div>
                          {rule.requireDeposit && (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {rule.depositAmount != null && (
                                <span className="text-xs text-muted-foreground">
                                  {rule.depositAmount.toLocaleString()}
                                  {rule.depositPerGuest ? " /guest" : ""}
                                </span>
                              )}
                              {rule.depositRequiredMinPartySize != null && (
                                <span className="text-xs text-muted-foreground">
                                  &middot; Min{" "}
                                  {rule.depositRequiredMinPartySize} guests
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(rule)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {rule.canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(rule.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Deposit Rule" : "Add Deposit Rule"}
            </DialogTitle>
            <DialogDescription>
              Configure deposit requirements for reservations
            </DialogDescription>
          </DialogHeader>
          <DepositRuleForm
            item={editingRule}
            onSuccess={handleSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

function DepositRuleForm({
  item,
  onSuccess,
  onCancel,
}: {
  item: DepositRule | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [tables, setTables] = useState<Space[]>([]);
  const [slots, setSlots] = useState<ReservationSlot[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [spacesData, slotsData] = await Promise.all([
          fetchAllSpaces(),
          fetchReservationSlots(),
        ]);
        setTables(
          spacesData.filter(
            (s: Space) => s.active && BOOKABLE_TYPES.includes(s.type),
          ),
        );
        setSlots(slotsData.filter((s) => s.active));
      } catch {
        // silent — pickers will be empty
      }
    };
    loadData();
  }, []);

  const form = useForm<z.infer<typeof DepositRuleSchema>>({
    resolver: zodResolver(DepositRuleSchema),
    defaultValues: {
      scope: (item?.scope as any) ?? undefined,
      reservationSlotId: (item?.reservationSlotId as string) ?? undefined,
      tableAndSpaceId: (item?.tableAndSpaceId as string) ?? undefined,
      requireDeposit: item?.requireDeposit ?? true,
      depositAmount: item?.depositAmount ?? undefined,
      depositPerGuest: item?.depositPerGuest ?? false,
      depositRequiredMinPartySize:
        item?.depositRequiredMinPartySize ?? undefined,
    },
  });

  const selectedScope = form.watch("scope");
  const requireDeposit = form.watch("requireDeposit");

  const showSlotPicker =
    selectedScope === "SLOT" || selectedScope === "TABLE_SLOT";
  const showTablePicker =
    selectedScope === "TABLE" || selectedScope === "TABLE_SLOT";

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.log("Deposit rule form errors:", errors);
    toast({
      variant: "destructive",
      title: "Validation error",
      description: "Please check the form fields",
    });
  }, []);

  const onSubmit = (values: z.infer<typeof DepositRuleSchema>) => {
    // Clear scope-irrelevant fields
    if (!showSlotPicker) values.reservationSlotId = undefined;
    if (!showTablePicker) values.tableAndSpaceId = undefined;
    if (!values.requireDeposit) {
      values.depositAmount = undefined;
      values.depositPerGuest = false;
      values.depositRequiredMinPartySize = undefined;
    }

    startTransition(async () => {
      const result = item
        ? await updateDepositRule(item.id, values)
        : await createDepositRule(values);

      if (result?.responseType === "success") {
        toast({
          variant: "success",
          title: "Success",
          description: result.message,
        });
        onSuccess();
      } else if (result?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    });
  };

  const formatSlotOption = (slot: ReservationSlot) => {
    const day = DAY_OF_WEEK_LABELS[slot.dayOfWeek] || slot.dayOfWeek;
    const start = slot.startTime?.substring(0, 5) || "";
    const end = slot.endTime?.substring(0, 5) || "";
    return `${day} ${start}–${end}`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        <div className="space-y-4">
          {/* Scope */}
          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scope</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    if (val !== "SLOT" && val !== "TABLE_SLOT")
                      form.setValue("reservationSlotId", undefined);
                    if (val !== "TABLE" && val !== "TABLE_SLOT")
                      form.setValue("tableAndSpaceId", undefined);
                  }}
                  value={field.value ?? ""}
                  disabled={isPending || !!item}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="GLOBAL">
                      Global (default rule)
                    </SelectItem>
                    <SelectItem value="SLOT">Slot (day + time range)</SelectItem>
                    <SelectItem value="TABLE">Table (all slots)</SelectItem>
                    <SelectItem value="TABLE_SLOT">
                      Table + Slot (most specific)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Slot picker */}
          {showSlotPicker && (
            <FormField
              control={form.control}
              name="reservationSlotId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reservation Slot</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select slot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {slots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id as string}>
                          {formatSlotOption(slot)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    The day and time window this rule applies to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Table picker */}
          {showTablePicker && (
            <FormField
              control={form.control}
              name="tableAndSpaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table / Space</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tables.map((t) => (
                        <SelectItem key={t.id} value={t.id as string}>
                          {t.name}
                          {t.capacity ? ` (${t.capacity} seats)` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Separator />

          {/* Require Deposit */}
          <FormField
            control={form.control}
            name="requireDeposit"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="cursor-pointer">
                    Require Deposit
                  </FormLabel>
                  <FormDescription className="text-xs">
                    {showTablePicker
                      ? "Disable to waive deposit for this table"
                      : "Enable to require a deposit"}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Deposit details (only when requireDeposit is true) */}
          {requireDeposit && (
            <>
              <FormField
                control={form.control}
                name="depositAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Amount"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value),
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
                name="depositPerGuest"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="cursor-pointer">
                        Per Guest
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Multiply deposit amount by party size
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="depositRequiredMinPartySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Party Size for Deposit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="No minimum"
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
                    <FormDescription className="text-xs">
                      Only require deposit for parties of this size or larger
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {item ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default DepositRuleManager;
