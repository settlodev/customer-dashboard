"use client";

import React, { useCallback, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
import { UUID } from "node:crypto";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
import {
  ControlInput,
  ControlTextarea,
  FieldLabel,
  controlSelectTriggerClass,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "@/components/settings/shared/settings-section";
import { ConfirmDeleteButton } from "@/components/settings/shared/confirm-delete-button";
import {
  SettingsTableCard,
  tableHeadRowClass,
  tdActionsClass,
  tdClass,
  thClass,
  trClass,
} from "@/components/settings/shared/settings-table";
import { Loader2, Plus, CalendarDays, CalendarOff, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  ReservationException,
  EXCEPTION_TYPE_LABELS,
} from "@/types/reservation/type";
import { ReservationExceptionType } from "@/types/enums";
import { ReservationExceptionSchema } from "@/types/reservation/schema";
import {
  createReservationException,
  updateReservationException,
  deleteReservationException,
} from "@/lib/actions/reservation-actions";

interface Props {
  exceptions: ReservationException[];
  onRefresh: () => void;
}

const EXCEPTION_TYPE_COLORS: Record<ReservationExceptionType, string> = {
  [ReservationExceptionType.CLOSED]: "border-neg/30 bg-neg-tint text-neg",
  [ReservationExceptionType.HOLIDAY]: "border-primary/30 bg-primary/10 text-primary",
  [ReservationExceptionType.MAINTENANCE]: "border-warn/30 bg-warn-tint text-warn",
  [ReservationExceptionType.PRIVATE_EVENT]: "border-line bg-canvas text-ink-2",
  [ReservationExceptionType.BLOCKED]: "border-neg/30 bg-neg-tint text-neg",
};

const ReservationExceptionManager = ({ exceptions, onRefresh }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingException, setEditingException] =
    useState<ReservationException | null>(null);

  const handleAdd = () => {
    setEditingException(null);
    setDialogOpen(true);
  };

  const handleEdit = (exception: ReservationException) => {
    setEditingException(exception);
    setDialogOpen(true);
  };

  const handleDelete = async (id: UUID) => {
    try {
      await deleteReservationException(id);
      toast({
        variant: "success",
        title: "Success",
        description: "Exception deleted successfully",
      });
      onRefresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete exception",
      });
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingException(null);
    onRefresh();
  };

  const sorted = [...exceptions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <>
      <SettingsSection
        icon={<CalendarOff className="h-4 w-4" />}
        title="Exceptions"
        description="Date-based closures, holidays and blocked time ranges that override the weekly schedule."
        footer={
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" /> Add exception
          </Button>
        }
      >
        <SettingsTableCard
          isEmpty={sorted.length === 0}
          emptyLabel="No exceptions configured. Add one to close a date or block a time range."
        >
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={thClass}>Date</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Hours</th>
                <th className={thClass}>Reason</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((exception) => {
                const dateFormatted = new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                }).format(new Date(exception.date));
                const hasTimeRange = exception.startTime || exception.endTime;
                const colorClass =
                  EXCEPTION_TYPE_COLORS[exception.type as ReservationExceptionType] ||
                  "border-line bg-canvas text-ink-2";

                return (
                  <tr key={exception.id} className={trClass}>
                    <td className={`${tdClass} font-medium`}>{dateFormatted}</td>
                    <td className={tdClass}>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${colorClass}`}
                      >
                        {EXCEPTION_TYPE_LABELS[
                          exception.type as ReservationExceptionType
                        ] || exception.type}
                      </span>
                    </td>
                    <td
                      className={`${tdClass} font-mono text-[12px] tabular-nums text-ink-2`}
                    >
                      {hasTimeRange ? (
                        <>
                          {exception.startTime?.substring(0, 5) || "Start"} –{" "}
                          {exception.endTime?.substring(0, 5) || "End"}
                        </>
                      ) : (
                        "Full day"
                      )}
                    </td>
                    <td className={`${tdClass} text-ink-2`}>
                      {exception.reason || "—"}
                    </td>
                    <td className={tdActionsClass}>
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(exception)}
                        >
                          Edit
                        </Button>
                        <ConfirmDeleteButton
                          onConfirm={() => handleDelete(exception.id)}
                          title="Delete this exception?"
                          description={`${dateFormatted} goes back to the normal weekly schedule and starts accepting reservations again.`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SettingsTableCard>
      </SettingsSection>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingException ? "Edit Exception" : "Add Exception"}
            </DialogTitle>
            <DialogDescription>
              Block a date or time range from accepting reservations
            </DialogDescription>
          </DialogHeader>
          <ExceptionForm
            item={editingException}
            onSuccess={handleSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

function ExceptionForm({
  item,
  onSuccess,
  onCancel,
}: {
  item: ReservationException | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof ReservationExceptionSchema>>({
    resolver: zodResolver(ReservationExceptionSchema),
    defaultValues: {
      date: item?.date ?? "",
      startTime: item?.startTime ?? undefined,
      endTime: item?.endTime ?? undefined,
      reason: item?.reason ?? undefined,
      type: (item?.type as any) ?? undefined,
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Exception form errors:", errors);
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please check the form fields",
      });
    },
    [],
  );

  const onSubmit = (values: z.infer<typeof ReservationExceptionSchema>) => {
    startTransition(async () => {
      const result = item
        ? await updateReservationException(item.id, values)
        : await createReservationException(values);

      if (result?.responseType === "success") {
        toast({ variant: "success", title: "Success", description: result.message });
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

  const selectedType = form.watch("type");
  const isFullDay = ["CLOSED", "HOLIDAY", "MAINTENANCE"].includes(
    selectedType || "",
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        <div className="space-y-3.5">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="min-w-0 space-y-[7px]">
                <FieldLabel required>Type</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger className={controlSelectTriggerClass}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(EXCEPTION_TYPE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="min-w-0 space-y-[7px]">
                <FieldLabel required>Date</FieldLabel>
                <FormControl>
                  <ControlInput
                    type="date"
                    mono
                    prefix={<CalendarDays className="h-3.5 w-3.5" />}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isFullDay && (
            <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="min-w-0 space-y-[7px]">
                    <FieldLabel optional>Start Time</FieldLabel>
                    <FormControl>
                      <ControlInput
                        type="time"
                        mono
                        prefix={<Clock className="h-3.5 w-3.5" />}
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
                name="endTime"
                render={({ field }) => (
                  <FormItem className="min-w-0 space-y-[7px]">
                    <FieldLabel optional>End Time</FieldLabel>
                    <FormControl>
                      <ControlInput
                        type="time"
                        mono
                        prefix={<Clock className="h-3.5 w-3.5" />}
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
          )}

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem className="min-w-0 space-y-[7px]">
                <FieldLabel optional>Reason</FieldLabel>
                <FormControl>
                  <ControlTextarea
                    placeholder="e.g., Christmas Day closure"
                    {...field}
                    value={field.value ?? ""}
                    disabled={isPending}
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? "Saving…" : item ? "Save changes" : "Create exception"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default ReservationExceptionManager;
