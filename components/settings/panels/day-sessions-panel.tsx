"use client";

import { useMemo, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { CalendarClock, Clock, Coins, Sun, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  ControlInput,
  StandaloneField as Field,
  ToggleRow,
  standaloneLabelClass,
} from "@/components/ui/field";
import {
  SettingsSection,
  parseOptionalNumber,
} from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import {
  SettingsSaveBar,
  combineSaveScopes,
  type SaveScope,
} from "../shared/settings-save-bar";
import type {
  DayOfWeek,
  LocationSettings,
  OperatingHours,
} from "@/types/location-settings/type";
import { DAYS_OF_WEEK, DAY_LABELS } from "@/types/location-settings/type";
import { updateLocationSettings } from "@/lib/actions/location-settings-actions";

const KEYS = [
  "autoOpenDay",
  "autoCloseDay",
  "closeGraceMinutes",
  "maxSessionLengthHours",
  "minimumSettlementAmount",
] as const;

const DEFAULT_CUTOFF = "04:00";

export function DaySessionsPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const hours = useOperatingHours(settings, onSaved);
  // Both scopes write the same settings row, so one bar saves whichever changed.
  const page = combineSaveScopes(p, hours);
  const v = p.values;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Day sessions & hours"
        description="Rolls the business day, sets opening hours, and controls settlement timing."
      />

      <SettingsSection
        icon={<Sun className="h-4 w-4" />}
        title="Day sessions"
        description="Group orders, cash movements, and staff activity into a discrete business day."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Auto-open day"
            hint="Open the day automatically at the start of operating hours."
            checked={!!v.autoOpenDay}
            onChange={(x) => p.setField("autoOpenDay", x)}
            disabled={p.isPending}
          />
          <ToggleRow
            label="Auto-close day"
            hint="Close the day automatically at the end of operating hours."
            checked={!!v.autoCloseDay}
            onChange={(x) => p.setField("autoCloseDay", x)}
            disabled={p.isPending}
          />
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Close grace period"
            hint="Delay after close time before auto-close fires. The extend button only works inside this window."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={0}
                max={720}
                suffix="min"
                prefix={<Timer className="h-3.5 w-3.5" />}
                value={v.closeGraceMinutes ?? ""}
                onChange={(e) =>
                  p.setField("closeGraceMinutes", parseOptionalNumber(e.target.value))
                }
                placeholder="30"
                disabled={p.isPending || !v.autoCloseDay}
              />
            )}
          </Field>
          <Field
            label="Max session length"
            hint="Hard ceiling — longer sessions auto-close whatever the operating hours say."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={6}
                max={168}
                suffix="hours"
                prefix={<Clock className="h-3.5 w-3.5" />}
                value={v.maxSessionLengthHours ?? ""}
                onChange={(e) =>
                  p.setField("maxSessionLengthHours", parseOptionalNumber(e.target.value))
                }
                placeholder="24"
                disabled={p.isPending}
              />
            )}
          </Field>
          <Field
            label="Minimum settlement amount"
            hint="Below this, a settlement isn't required at close."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="decimal"
                mono
                min={0}
                suffix={settings.currency || undefined}
                prefix={<Coins className="h-3.5 w-3.5" />}
                value={v.minimumSettlementAmount ?? ""}
                onChange={(e) =>
                  p.setField("minimumSettlementAmount", parseOptionalNumber(e.target.value))
                }
                placeholder="0"
                disabled={p.isPending}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <OperatingHoursCard hours={hours} />

      <SettingsSaveBar
        dirtyCount={page.dirtyCount}
        isPending={page.isPending}
        onSave={page.save}
        onDiscard={page.reset}
      />
    </div>
  );
}

/**
 * Operating hours editor — "this location is open 24 hours" toggle above the
 * weekly hours table. When 24h is on, the table is hidden and a cutoff time
 * picker takes its place. On save, the payload depends on which mode is
 * active so we don't clobber operating hours the backend should keep
 * around for re-use later.
 */
interface OperatingHoursScope extends SaveScope {
  hours: OperatingHours[];
  continuous: boolean;
  cutoff: string;
  setContinuous: (next: boolean) => void;
  setCutoff: (next: string) => void;
  update: (day: DayOfWeek, patch: Partial<OperatingHours>) => void;
}

function useOperatingHours(
  settings: LocationSettings,
  onSaved: (next: LocationSettings) => void,
): OperatingHoursScope {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const seedHours = useMemo<OperatingHours[]>(() => {
    const byDay = new Map<DayOfWeek, OperatingHours>();
    for (const h of settings.operatingHours ?? []) byDay.set(h.dayOfWeek, h);
    return DAYS_OF_WEEK.map(
      (d) =>
        byDay.get(d) ?? {
          dayOfWeek: d,
          openTime: "08:00",
          closeTime: "22:00",
          closed: false,
        },
    );
  }, [settings.operatingHours]);

  const [hours, setHours] = useState<OperatingHours[]>(seedHours);
  const [hoursBaseline, setHoursBaseline] =
    useState<OperatingHours[]>(seedHours);
  const [continuous, setContinuous] = useState<boolean>(
    !!settings.continuousOperation,
  );
  const [continuousBaseline, setContinuousBaseline] = useState<boolean>(
    !!settings.continuousOperation,
  );
  const [cutoff, setCutoff] = useState<string>(
    settings.dailyCutoffTime ?? DEFAULT_CUTOFF,
  );
  const [cutoffBaseline, setCutoffBaseline] = useState<string>(
    settings.dailyCutoffTime ?? DEFAULT_CUTOFF,
  );

  // One "change" per edited thing so the page bar's count reads sensibly:
  // the 24h flag, plus either the cutoff or the weekly table.
  const dirtyCount =
    (continuous !== continuousBaseline ? 1 : 0) +
    (continuous
      ? cutoff !== cutoffBaseline
        ? 1
        : 0
      : JSON.stringify(hours) !== JSON.stringify(hoursBaseline)
        ? 1
        : 0);
  const isDirty = dirtyCount > 0;

  const update = (day: DayOfWeek, patch: Partial<OperatingHours>) =>
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === day ? { ...h, ...patch } : h)),
    );

  const save = () =>
    startTransition(async () => {
      // 24h on → send cutoff + flag, do NOT send operatingHours.
      // 24h off → send operatingHours + flag=false.
      const payload = continuous
        ? { continuousOperation: true, dailyCutoffTime: cutoff }
        : { continuousOperation: false, operatingHours: hours };

      const res = await updateLocationSettings(payload);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't save operating hours",
          description: res.message,
        });
        return;
      }
      toast({ title: "Saved", description: res.message });
      if (res.data) {
        setHoursBaseline(hours);
        setContinuousBaseline(continuous);
        setCutoffBaseline(cutoff);
        onSaved(res.data);
      }
    });

  const reset = () => {
    setHours(hoursBaseline);
    setContinuous(continuousBaseline);
    setCutoff(cutoffBaseline);
  };

  return {
    hours,
    continuous,
    cutoff,
    setContinuous,
    setCutoff,
    update,
    dirtyCount,
    isDirty,
    isPending,
    save,
    reset,
  };
}

/** Presentational half of {@link useOperatingHours}. */
function OperatingHoursCard({ hours: scope }: { hours: OperatingHoursScope }) {
  const { hours, continuous, cutoff, setContinuous, setCutoff, update, isPending } =
    scope;

  return (
    <SettingsSection
      icon={<CalendarClock className="h-4 w-4" />}
      title="Operating hours"
      description="Used for day-session auto roll-over and reservations availability."
    >
      <ToggleRow
        label="Open 24 hours"
        hint="Hide the weekly table and run continuously. Day sessions roll over at the cutoff time below."
        checked={continuous}
        onChange={setContinuous}
        disabled={isPending}
      />

      {continuous ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Daily rollover time"
            hint="A quiet hour when the business day closes and reopens. Required while 24-hour operation is on."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="time"
                mono
                required
                prefix={<Clock className="h-3.5 w-3.5" />}
                value={cutoff}
                onChange={(e) => setCutoff(e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="hidden items-center gap-3 border-b border-line bg-canvas px-4 py-2 sm:flex">
            <span className={`${standaloneLabelClass} w-28 shrink-0`}>Day</span>
            <span className={`${standaloneLabelClass} w-24 shrink-0`}>Status</span>
            <span className={standaloneLabelClass}>Opens / closes</span>
          </div>
          {hours.map((h) => (
            <div
              key={h.dayOfWeek}
              className="flex flex-col gap-2.5 border-b border-line px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="w-28 shrink-0 text-[13px] font-medium text-ink">
                {DAY_LABELS[h.dayOfWeek]}
              </span>
              <div className="flex w-24 shrink-0 items-center gap-2">
                <Switch
                  checked={!h.closed}
                  onCheckedChange={(val) => update(h.dayOfWeek, { closed: !val })}
                  disabled={isPending}
                  aria-label={`${DAY_LABELS[h.dayOfWeek]} open`}
                />
                <span className="text-[12px] text-muted-foreground">
                  {h.closed ? "Closed" : "Open"}
                </span>
              </div>
              <div className="flex flex-1 items-center gap-2">
                <ControlInput
                  type="time"
                  mono
                  aria-label={`${DAY_LABELS[h.dayOfWeek]} opening time`}
                  value={h.openTime ?? ""}
                  onChange={(e) => update(h.dayOfWeek, { openTime: e.target.value })}
                  disabled={isPending || h.closed}
                />
                <span className="shrink-0 text-[12px] text-muted-foreground">to</span>
                <ControlInput
                  type="time"
                  mono
                  aria-label={`${DAY_LABELS[h.dayOfWeek]} closing time`}
                  value={h.closeTime ?? ""}
                  onChange={(e) => update(h.dayOfWeek, { closeTime: e.target.value })}
                  disabled={isPending || h.closed}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SettingsSection>
  );
}
