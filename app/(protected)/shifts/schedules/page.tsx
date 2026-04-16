"use client";

import React, { useCallback, useEffect, useState } from "react";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusIcon, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  StaffSchedule,
  listSchedules,
  createSchedule,
  cancelSchedule,
} from "@/lib/actions/shift-schedule-actions";
import { fectchAllShifts } from "@/lib/actions/shift-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Staff } from "@/types/staff";
import { Shift } from "@/types/shift/type";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const breadcrumbItems = [
  { title: "Shifts", link: "/shifts" },
  { title: "Schedules", link: "/shifts/schedules" },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<Shift[]>([]);
  const [locationId, setLocationId] = useState<string>("");
  const [form, setForm] = useState({ staffId: "", shiftTemplateId: "", scheduleDate: "", notes: "" });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const loc = await getCurrentLocation();
      const locId = loc?.id ?? "";
      setLocationId(locId);
      const data = await listSchedules(locId);
      setSchedules(data.content ?? []);
    } catch {
      // failed
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
    fetchAllStaff().then(setStaffList).catch(() => {});
    fectchAllShifts().then(setShiftTemplates).catch(() => {});
  }, [loadSchedules]);

  const handleCreate = async () => {
    if (!form.staffId || !form.shiftTemplateId || !form.scheduleDate) return;
    setIsCreating(true);
    try {
      const result = await createSchedule({
        locationId,
        staffId: form.staffId,
        shiftTemplateId: form.shiftTemplateId,
        scheduleDate: form.scheduleDate,
        notes: form.notes || undefined,
      });
      toast({ variant: result.responseType === "success" ? "success" : "destructive", title: result.message });
      if (result.responseType === "success") {
        setShowCreate(false);
        setForm({ staffId: "", shiftTemplateId: "", scheduleDate: "", notes: "" });
        loadSchedules();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = async (id: string) => {
    const result = await cancelSchedule(id);
    toast({ variant: result.responseType === "success" ? "success" : "destructive", title: result.message });
    if (result.responseType === "success") loadSchedules();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
      case "COMPLETED": return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400";
      case "CANCELLED": return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex items-center justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <PlusIcon className="h-4 w-4 mr-1.5" />
          New Schedule
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading schedules...</span>
          </CardContent>
        </Card>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-sm font-medium mb-1">No schedules</h3>
            <p className="text-xs text-muted-foreground mb-4">Create shift schedules for your staff.</p>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <PlusIcon className="h-4 w-4 mr-1.5" />
              New Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Staff Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">{s.staffName}</span>
                      <Badge variant="outline" className={`text-[10px] ${statusColor(s.status)}`}>{s.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.shiftTemplateName} · {s.scheduledDate} · {s.startTime}–{s.endTime}
                    </p>
                    {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                  </div>
                  {s.status === "SCHEDULED" && (
                    <Button size="sm" variant="ghost" className="text-xs text-red-600" onClick={() => handleCancel(s.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Schedule Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Staff <span className="text-red-500">*</span></label>
              <Select onValueChange={(v) => setForm((p) => ({ ...p, staffId: v }))} value={form.staffId}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Shift Template <span className="text-red-500">*</span></label>
              <Select onValueChange={(v) => setForm((p) => ({ ...p, shiftTemplateId: v }))} value={form.shiftTemplateId}>
                <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                <SelectContent>
                  {shiftTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.startTime}–{t.endTime})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Date <span className="text-red-500">*</span></label>
              <Input type="date" value={form.scheduleDate} onChange={(e) => setForm((p) => ({ ...p, scheduleDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Notes</label>
              <Input placeholder="Optional notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              disabled={isCreating || !form.staffId || !form.shiftTemplateId || !form.scheduleDate}
              onClick={handleCreate}
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
