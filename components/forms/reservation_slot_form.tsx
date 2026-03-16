"use client";

import React, { useCallback, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
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
import { Loader2, Plus, Pencil, Trash2, Clock } from "lucide-react";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {slots.length} slot rule{slots.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Slot Rule
        </Button>
      </div>

      {slots.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-lg">No slot rules configured</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add time windows for each day of the week to define when
              reservations are accepted
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const daySlots = grouped[day];
            if (!daySlots || daySlots.length === 0) return null;
            return (
              <Card key={day}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {DAY_OF_WEEK_LABELS[day]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={slot.active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {slot.active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="font-medium">
                          {slot.startTime?.substring(0, 5)} –{" "}
                          {slot.endTime?.substring(0, 5)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Every {slot.slotDurationMinutes}min
                        </span>
                        {slot.maxReservations && (
                          <span className="text-sm text-muted-foreground">
                            · Max {slot.maxReservations} bookings
                          </span>
                        )}
                        {slot.maxGuests && (
                          <span className="text-sm text-muted-foreground">
                            · Max {slot.maxGuests} guests
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(slot)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {slot.canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(slot.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
    </div>
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
        toast({ title: "Success", description: result.message });
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
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="dayOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day of Week</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} disabled={isPending} />
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
              <FormItem>
                <FormLabel>Slot Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={5}
                    step={5}
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="maxReservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Bookings/Slot</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="No limit"
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
                <FormItem>
                  <FormLabel>Max Guests/Slot</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="No limit"
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

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <FormLabel className="cursor-pointer">Active</FormLabel>
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

export default ReservationSlotManager;
