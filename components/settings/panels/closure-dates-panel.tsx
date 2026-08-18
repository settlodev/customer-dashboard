"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { SettingsSection } from "../shared/settings-section";
import {
  listClosureDates,
  createClosureDate,
  updateClosureDate,
  deleteClosureDate,
} from "@/lib/actions/location-closure-dates-actions";
import type { LocationClosureDate } from "@/types/location-closure-date/type";

const todayStr = () => new Date().toISOString().slice(0, 10);

export function ClosureDatesPanel() {
  const [items, setItems] = useState<LocationClosureDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const { toast } = useToast();

  const refresh = async () => {
    setLoading(true);
    const res = await listClosureDates(upcomingOnly);
    setItems(res);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingOnly]);

  const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <SettingsSection
      title="Closure dates"
      description="Mark days the location is closed so reports, reservations and staff schedules skip them."
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Switch
            checked={upcomingOnly}
            onCheckedChange={setUpcomingOnly}
            aria-label="Show upcoming only"
          />
          <span className="text-muted-foreground">Show upcoming only</span>
        </div>
        <AddClosureDateDialog onAdded={refresh} />
      </div>

      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground italic">
            No {upcomingOnly ? "upcoming " : ""}closure dates.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border divide-y">
          {items.map((item) => (
            <ClosureDateRow
              key={item.id}
              item={item}
              onChange={refresh}
              onDelete={async () => {
                const res = await deleteClosureDate(item.id);
                if (res.responseType === "error") {
                  toast({
                    variant: "destructive",
                    title: "Couldn't remove",
                    description: res.message,
                  });
                  return;
                }
                toast({ title: "Removed" });
                refresh();
              }}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </SettingsSection>
  );
}

function AddClosureDateDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [closureDate, setClosureDate] = useState<string>(todayStr());
  const [reason, setReason] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const onSubmit = () => {
    startTransition(async () => {
      const res = await createClosureDate({
        closureDate,
        reason: reason.trim() || undefined,
        allDay,
      });
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't add",
          description: res.message,
        });
        return;
      }
      toast({ title: "Closure date added" });
      setOpen(false);
      setClosureDate(todayStr());
      setReason("");
      setAllDay(true);
      onAdded();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add closure
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add closure date</DialogTitle>
          <DialogDescription>
            Pick a day and an optional reason. Reservations and schedules will
            avoid this date automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Date</label>
            <Input
              type="date"
              value={closureDate}
              onChange={(e) => setClosureDate(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Reason (optional)</label>
            <Input
              placeholder="e.g. Public holiday, staff retreat…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
            <div>
              <p className="text-sm font-medium">All day</p>
              <p className="text-[11px] text-muted-foreground">
                Leave on for a regular closure. Turn off if you intend to
                handle it as a partial-day later.
              </p>
            </div>
            <Switch checked={allDay} onCheckedChange={setAllDay} disabled={isPending} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClosureDateRow({
  item,
  onChange,
  onDelete,
  formatDate,
}: {
  item: LocationClosureDate;
  onChange: () => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState(item.reason ?? "");
  const [allDay, setAllDay] = useState(item.allDay);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const save = () =>
    startTransition(async () => {
      const res = await updateClosureDate(item.id, {
        closureDate: item.closureDate,
        reason: reason.trim() || undefined,
        allDay,
      });
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't save",
          description: res.message,
        });
        return;
      }
      toast({ title: "Updated" });
      setEditing(false);
      onChange();
    });

  return (
    <div className="p-3 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{formatDate(item.closureDate)}</p>
        {editing ? (
          <div className="mt-2 space-y-2">
            <Input
              placeholder="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
            />
            <div className="flex items-center gap-2">
              <Switch checked={allDay} onCheckedChange={setAllDay} disabled={isPending} />
              <span className="text-xs text-muted-foreground">All day</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {item.reason || "No reason set"}
            {item.allDay ? " · All day" : " · Partial"}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <Button size="sm" onClick={save} disabled={isPending}>
              {isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={isPending}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" className="text-red-600" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
