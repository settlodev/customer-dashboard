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
  FieldLabel,
  ToggleRow,
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
import {
  Loader2,
  Plus,
  CalendarCheck,
  Clock,
  Timer,
  Users,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  ReservationSlot,
  DAY_OF_WEEK_LABELS,
  DAYS_OF_WEEK,
} from "@/types/reservation/type";
import { ReservationSlotSchema } from "@/types/reservation/schema";
import {
  createReservationSlot,
  updateReservationSlot,
  deleteReservationSlot,
} from "@/lib/actions/reservation-actions";

interface Props {
  slots: ReservationSlot[];
  onRefresh: () => void;
}

const ReservationSlotManager = ({ slots, onRefresh }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ReservationSlot | null>(null);

  const handleAdd = () => {
    setEditingSlot(null);
    setDialogOpen(true);
  };

  const handleEdit = (slot: ReservationSlot) => {
    setEditingSlot(slot);
    setDialogOpen(true);
  };

  const handleDelete = async (id: UUID) => {
    try {
      await deleteReservationSlot(id);
      toast({
        variant: "success",
        title: "Success",
        description: "Slot rule deleted successfully",
      });
      onRefresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete slot rule",
      });
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingSlot(null);
    onRefresh();
  };

  const grouped = DAYS_OF_WEEK.reduce(
    (acc, day) => {
      acc[day] = slots.filter((s) => s.dayOfWeek === day);
      return acc;
    },
    {} as Record<string, ReservationSlot[]>,
  );

  // Flatten back out in week order so the table reads Monday → Sunday.
  const orderedSlots = DAYS_OF_WEEK.flatMap((day) => grouped[day] ?? []);

  return (
    <>
      <SettingsSection
        icon={<Clock className="h-4 w-4" />}
        title="Reservation schedule"
        description="Time windows for each day of the week that define when reservations are accepted."
        footer={
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" /> Add slot rule
          </Button>
        }
      >
        <SettingsTableCard
          isEmpty={orderedSlots.length === 0}
          emptyLabel="No slot rules configured. Add a time window so guests can pick a booking time."
        >
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={thClass}>Day</th>
                <th className={thClass}>Window</th>
                <th className={`${thClass} text-right`}>Slot every</th>
                <th className={`${thClass} text-right`}>Max bookings</th>
                <th className={`${thClass} text-right`}>Max guests</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderedSlots.map((slot) => (
                <tr key={slot.id} className={trClass}>
                  <td className={`${tdClass} font-medium`}>
                    {DAY_OF_WEEK_LABELS[slot.dayOfWeek]}
                  </td>
                  <td className={`${tdClass} font-mono text-[12px] tabular-nums`}>
                    {slot.startTime?.substring(0, 5)} –{" "}
                    {slot.endTime?.substring(0, 5)}
                  </td>
                  <td
                    className={`${tdClass} text-right font-mono text-[12px] tabular-nums text-ink-2`}
                  >
                    {slot.slotDurationMinutes} min
                  </td>
                  <td
                    className={`${tdClass} text-right font-mono text-[12px] tabular-nums text-ink-2`}
                  >
                    {slot.maxReservations ?? "—"}
                  </td>
                  <td
                    className={`${tdClass} text-right font-mono text-[12px] tabular-nums text-ink-2`}
                  >
                    {slot.maxGuests ?? "—"}
                  </td>
                  <td className={tdClass}>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                        slot.active ? "text-pos" : "text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          slot.active ? "bg-pos" : "bg-muted-2"
                        }`}
                      />
                      {slot.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={tdActionsClass}>
                    <div className="inline-flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(slot)}
                      >
                        Edit
                      </Button>
                      <ConfirmDeleteButton
                        onConfirm={() => handleDelete(slot.id)}
                        title="Delete this slot rule?"
                        description={`${DAY_OF_WEEK_LABELS[slot.dayOfWeek]} ${slot.startTime?.substring(0, 5)}–${slot.endTime?.substring(0, 5)} stops being offered on the booking page. Reservations already taken in this window are kept.`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SettingsTableCard>
      </SettingsSection>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? "Edit Slot Rule" : "Add Slot Rule"}
            </DialogTitle>
            <DialogDescription>
              Define a time window for accepting reservations
            </DialogDescription>
          </DialogHeader>
          <SlotForm
            item={editingSlot}
            onSuccess={handleSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

function SlotForm({
  item,
  onSuccess,
  onCancel,
}: {
  item: ReservationSlot | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof ReservationSlotSchema>>({
    resolver: zodResolver(ReservationSlotSchema),
    defaultValues: {
      dayOfWeek: (item?.dayOfWeek as any) ?? undefined,
      startTime: item?.startTime ?? "",
      endTime: item?.endTime ?? "",
      slotDurationMinutes: item?.slotDurationMinutes ?? 30,
      maxReservations: item?.maxReservations ?? undefined,
      maxGuests: item?.maxGuests ?? undefined,
      active: item?.active ?? true,
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Slot form errors:", errors);
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please check the form fields",
      });
    },
    [],
  );

  const onSubmit = (values: z.infer<typeof ReservationSlotSchema>) => {
    startTransition(async () => {
      const result = item
        ? await updateReservationSlot(item.id, values)
        : await createReservationSlot(values);

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        <div className="space-y-3.5">
          <FormField
            control={form.control}
            name="dayOfWeek"
            render={({ field }) => (
              <FormItem className="min-w-0 space-y-[7px]">
                <FieldLabel required>Day of Week</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger className={controlSelectTriggerClass}>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {DAY_OF_WEEK_LABELS[day]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel required>Start Time</FieldLabel>
                  <FormControl>
                    <ControlInput
                      type="time"
                      mono
                      prefix={<Clock className="h-3.5 w-3.5" />}
                      {...field}
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
                  <FieldLabel required>End Time</FieldLabel>
                  <FormControl>
                    <ControlInput
                      type="time"
                      mono
                      prefix={<Clock className="h-3.5 w-3.5" />}
                      {...field}
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
            name="slotDurationMinutes"
            render={({ field }) => (
              <FormItem className="min-w-0 space-y-[7px]">
                <FieldLabel required>Slot Duration</FieldLabel>
                <FormControl>
                  <ControlInput
                    type="number"
                    mono
                    min={5}
                    step={5}
                    prefix={<Timer className="h-3.5 w-3.5" />}
                    suffix="min"
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

          <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="maxReservations"
              render={({ field }) => (
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel optional>Max Bookings/Slot</FieldLabel>
                  <FormControl>
                    <ControlInput
                      type="number"
                      mono
                      min={1}
                      placeholder="No limit"
                      prefix={<CalendarCheck className="h-3.5 w-3.5" />}
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
              name="maxGuests"
              render={({ field }) => (
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel optional>Max Guests/Slot</FieldLabel>
                  <FormControl>
                    <ControlInput
                      type="number"
                      mono
                      min={1}
                      placeholder="No limit"
                      prefix={<Users className="h-3.5 w-3.5" />}
                      suffix="guests"
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

          <div className="grid grid-cols-1 gap-3">
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <ToggleRow
                  label="Active"
                  hint="Turn off to pause this window without deleting the rule."
                  checked={!!field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
          </div>
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
            {isPending ? "Saving…" : item ? "Save changes" : "Create slot rule"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default ReservationSlotManager;
