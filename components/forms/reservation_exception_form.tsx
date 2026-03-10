"use client";

import React, { useCallback, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
import { UUID } from "node:crypto";

import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, CalendarOff } from "lucide-react";
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
  [ReservationExceptionType.CLOSED]: "bg-red-100 text-red-800",
  [ReservationExceptionType.HOLIDAY]: "bg-purple-100 text-purple-800",
  [ReservationExceptionType.MAINTENANCE]: "bg-yellow-100 text-yellow-800",
  [ReservationExceptionType.PRIVATE_EVENT]: "bg-blue-100 text-blue-800",
  [ReservationExceptionType.BLOCKED]: "bg-orange-100 text-orange-800",
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {exceptions.length} exception{exceptions.length !== 1 ? "s" : ""}{" "}
            configured
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Exception
        </Button>
      </div>

      {exceptions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CalendarOff className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-lg">No exceptions configured</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add date-based closures, holidays, or blocked time ranges
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((exception) => {
            const dateFormatted = new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
            }).format(new Date(exception.date));
            const hasTimeRange = exception.startTime || exception.endTime;
            const colorClass =
              EXCEPTION_TYPE_COLORS[exception.type as ReservationExceptionType] ||
              "bg-gray-100 text-gray-800";

            return (
              <div
                key={exception.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge variant="outline" className={colorClass}>
                    {EXCEPTION_TYPE_LABELS[exception.type as ReservationExceptionType] ||
                      exception.type}
                  </Badge>
                  <div className="min-w-0">
                    <div className="font-medium">{dateFormatted}</div>
                    {hasTimeRange && (
                      <div className="text-sm text-muted-foreground">
                        {exception.startTime?.substring(0, 5) || "Start"} –{" "}
                        {exception.endTime?.substring(0, 5) || "End"}
                      </div>
                    )}
                    {!hasTimeRange && (
                      <div className="text-sm text-muted-foreground">
                        Full day
                      </div>
                    )}
                  </div>
                  {exception.reason && (
                    <span className="text-sm text-muted-foreground truncate">
                      — {exception.reason}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(exception)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {exception.canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(exception.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
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

  const selectedType = form.watch("type");
  const isFullDay = ["CLOSED", "HOLIDAY", "MAINTENANCE"].includes(
    selectedType || "",
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
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
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isFullDay && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
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
                  <FormItem>
                    <FormLabel>End Time (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
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
              <FormItem>
                <FormLabel>Reason (Optional)</FormLabel>
                <FormControl>
                  <Textarea
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
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {item ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default ReservationExceptionManager;
