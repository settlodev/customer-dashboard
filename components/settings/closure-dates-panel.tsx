"use client";

import React, { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import Loading from "@/components/ui/loading";
import {
  Loader2Icon,
  Plus,
  Trash2,
  Pencil,
  CalendarOff,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  ClosureDate,
  listClosureDates,
  createClosureDate,
  updateClosureDate,
  deleteClosureDate,
} from "@/lib/actions/location-closure-dates-actions";
import { Location } from "@/types/location/type";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ClosureDatesPanel = ({
  location,
}: {
  location: Location | null;
}) => {
  const [closureDates, setClosureDates] = useState<ClosureDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<ClosureDate | null>(null);
  const [formDate, setFormDate] = useState<Date | undefined>(undefined);
  const [formReason, setFormReason] = useState("");
  const [formRecurring, setFormRecurring] = useState(false);

  const loadData = async () => {
    if (!location?.id) return;
    try {
      setIsLoading(true);
      const data = await listClosureDates(location.id);
      setClosureDates(data);
    } catch (error) {
      console.error("Failed to load closure dates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [location?.id]);

  const resetForm = () => {
    setFormDate(undefined);
    setFormReason("");
    setFormRecurring(false);
    setSelectedDate(null);
  };

  const handleCreate = () => {
    if (!location?.id || !formDate) return;
    startTransition(async () => {
      const result = await createClosureDate(location.id, {
        date: format(formDate, "yyyy-MM-dd"),
        reason: formReason || undefined,
        recurring: formRecurring,
      });
      if (result.responseType === "success") {
        toast({ title: "Closure Date Added", description: result.message });
        resetForm();
        setShowAddDialog(false);
        await loadData();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  const handleUpdate = () => {
    if (!location?.id || !selectedDate) return;
    startTransition(async () => {
      const result = await updateClosureDate(location.id, selectedDate.id, {
        date: formDate ? format(formDate, "yyyy-MM-dd") : undefined,
        reason: formReason || undefined,
        recurring: formRecurring,
      });
      if (result.responseType === "success") {
        toast({ title: "Closure Date Updated", description: result.message });
        resetForm();
        setShowEditDialog(false);
        await loadData();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  const handleDelete = () => {
    if (!location?.id || !selectedDate) return;
    startTransition(async () => {
      try {
        await deleteClosureDate(location.id, selectedDate.id);
        toast({ title: "Closure Date Removed", description: "The closure date has been removed." });
        setShowDeleteDialog(false);
        setSelectedDate(null);
        await loadData();
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete closure date." });
      }
    });
  };

  const openEdit = (item: ClosureDate) => {
    setSelectedDate(item);
    setFormDate(new Date(item.date + "T00:00:00"));
    setFormReason(item.reason || "");
    setFormRecurring(item.recurring);
    setShowEditDialog(true);
  };

  const openDelete = (item: ClosureDate) => {
    setSelectedDate(item);
    setShowDeleteDialog(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Closure Dates</h2>
          <p className="text-muted-foreground mt-1 text-sm">Loading...</p>
        </div>
        <Card><CardContent className="p-6 flex items-center justify-center"><Loading /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Closure Dates</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage scheduled closures and holidays for {location?.name || "this location"}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} disabled={isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Add Closure Date
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {closureDates.length === 0 ? (
            <div className="text-center py-8">
              <CalendarOff className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No closure dates scheduled.</p>
              <p className="text-xs text-muted-foreground mt-1">Add dates when this location will be closed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {closureDates.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="text-sm font-medium">{formatDate(item.date)}</p>
                    {item.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                    )}
                    {item.recurring && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mt-1">
                        Recurring annually
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)} disabled={isPending}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDelete(item)} disabled={isPending}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Closure Date</DialogTitle>
            <DialogDescription>Schedule a date when this location will be closed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              {formDate && (
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{format(formDate, "PPP")}</span>
                </p>
              )}
              <div className="rounded-md border">
                <Calendar
                  mode="single"
                  selected={formDate}
                  onSelect={(date) => setFormDate(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="w-full"
                  classNames={{
                    months: "flex flex-col w-full",
                    month: "space-y-4 w-full",
                    table: "w-full border-collapse",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-sm",
                    row: "flex w-full mt-2",
                    cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-10 w-full rounded-md font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
                    nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border rounded-md",
                  }}
                  initialFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input value={formReason} onChange={(e) => setFormReason(e.target.value)} placeholder="e.g., Public Holiday" disabled={isPending} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Recurring Annually</p>
                <p className="text-xs text-muted-foreground">Repeat this closure every year</p>
              </div>
              <Switch checked={formRecurring} onCheckedChange={setFormRecurring} disabled={isPending} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending || !formDate}>
              {isPending ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Closure Date</DialogTitle>
            <DialogDescription>Update the closure date details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              {formDate && (
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{format(formDate, "PPP")}</span>
                </p>
              )}
              <div className="rounded-md border">
                <Calendar
                  mode="single"
                  selected={formDate}
                  onSelect={(date) => { if (date) setFormDate(date); }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="w-full"
                  classNames={{
                    months: "flex flex-col w-full",
                    month: "space-y-4 w-full",
                    table: "w-full border-collapse",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-sm",
                    row: "flex w-full mt-2",
                    cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-10 w-full rounded-md font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
                    nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border rounded-md",
                  }}
                  initialFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input value={formReason} onChange={(e) => setFormReason(e.target.value)} placeholder="e.g., Public Holiday" disabled={isPending} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Recurring Annually</p>
                <p className="text-xs text-muted-foreground">Repeat this closure every year</p>
              </div>
              <Switch checked={formRecurring} onCheckedChange={setFormRecurring} disabled={isPending} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isPending}>
              {isPending ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Closure Date</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this closure date? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClosureDatesPanel;
