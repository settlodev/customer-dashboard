"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CalendarDays,
  CalendarOff,
  Clock,
  Loader2,
  NotebookPen,
  Plus,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ControlInput,
  SegmentedBoolean,
  StandaloneField as Field,
  ToggleRow,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SettingsSection } from "../shared/settings-section";
import { ConfirmDeleteButton } from "../shared/confirm-delete-button";
import {
  SettingsTableCard,
  tableHeadRowClass,
  tdActionsClass,
  tdClass,
  thClass,
  trClass,
} from "../shared/settings-table";
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
      icon={<CalendarOff className="h-4 w-4" />}
      footer={<AddClosureDateDialog onAdded={refresh} />}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ToggleRow
          label="Show upcoming only"
          hint="Hide closures that have already passed."
          checked={upcomingOnly}
          onChange={setUpcomingOnly}
        />
      </div>

      <SettingsTableCard
        loading={loading}
        isEmpty={items.length === 0}
        emptyLabel={`No ${upcomingOnly ? "upcoming " : ""}closure dates.`}
      >
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Date</th>
              <th className={thClass}>Reason</th>
              <th className={thClass}>Coverage</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
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
          </tbody>
        </table>
      </SettingsTableCard>
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
        <Button size="sm">
          <Plus className="h-3.5 w-3.5" /> Add closure
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
        <div className="space-y-3.5">
          <Field label="Date" required>
            {(id) => (
              <ControlInput
                id={id}
                type="date"
                mono
                prefix={<CalendarDays className="h-3.5 w-3.5" />}
                value={closureDate}
                onChange={(e) => setClosureDate(e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
          <Field label="Reason" optional>
            {(id) => (
              <ControlInput
                id={id}
                prefix={<NotebookPen className="h-3.5 w-3.5" />}
                placeholder="e.g. Public holiday, staff retreat…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
          <div className="grid grid-cols-1 gap-3">
            <ToggleRow
              label="All day"
              hint="Leave on for a regular closure. Turn off if you intend to handle it as a partial-day later."
              checked={allDay}
              onChange={setAllDay}
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !closureDate}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? "Adding…" : "Add closure"}
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
    <tr className={trClass}>
      <td className={`${tdClass} whitespace-nowrap font-mono text-[12px]`}>
        {formatDate(item.closureDate)}
      </td>
      <td className={`${tdClass} min-w-[180px]`}>
        {editing ? (
          <ControlInput
            aria-label="Reason"
            prefix={<NotebookPen className="h-3.5 w-3.5" />}
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isPending}
          />
        ) : item.reason ? (
          item.reason
        ) : (
          <span className="text-muted-foreground">No reason set</span>
        )}
      </td>
      <td className={tdClass}>
        {editing ? (
          <SegmentedBoolean
            value={allDay}
            onChange={setAllDay}
            trueLabel="All day"
            falseLabel="Partial"
            disabled={isPending}
            stretch={false}
          />
        ) : item.allDay ? (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-ink-2">
            <Sun className="h-3.5 w-3.5 text-warn" />
            All day
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-ink-2">
            <Clock className="h-3.5 w-3.5 text-ink-3" />
            Partial
          </span>
        )}
      </td>
      <td className={tdActionsClass}>
        <div className="inline-flex items-center gap-1">
          {editing ? (
            <>
              <Button size="sm" onClick={save} disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <ConfirmDeleteButton
                disabled={isPending}
                onConfirm={onDelete}
                title={`Remove the closure on ${formatDate(item.closureDate)}?`}
                description="The location goes back to its normal opening hours on this day, and reservations, schedules and reports stop skipping it."
                confirmLabel="Remove"
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
