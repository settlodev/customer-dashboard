"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  Battery,
  BatteryCharging,
  Check,
  Copy,
  Info,
  Loader2,
  LogOut,
  MoreHorizontal,
  Plus,
  Smartphone,
  Tablet,
  Tag,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEntitlements } from "@/context/entitlementContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ControlInput,
  StandaloneField as Field,
  ToggleRow,
  standaloneLabelClass,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import DepartmentSelector from "@/components/widgets/department-selector";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { useRealtimeStatus } from "@/hooks/use-realtime-status";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { WsMessage } from "@/lib/realtime/types";

import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import {
  deleteDevice,
  generatePairingCode,
  listDevices,
  logoutDevice,
  suspendDevice,
  unsuspendDevice,
  updateDevice,
  updateDevicePinRequired,
  type DeviceActionResponse,
  type PairingCode,
} from "@/lib/actions/devices-actions";
import type { Device, DeviceStatus } from "@/types/device/type";
import {
  DEVICE_STATUS_DESCRIPTIONS,
  DEVICE_STATUS_LABELS,
} from "@/types/device/type";
import { PanelHeader } from "./shared/panel-header";
import { SectionTutorialDialog } from "@/components/widgets/help/section-tutorial-dialog";
import { TutorialSection } from "@/lib/tutorials";

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "—";
  const diff = Date.now() - ts;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon}mo ago`;
  return `${Math.floor(mon / 12)}y ago`;
}

// availableStorage arrives in MB (heartbeat payload `availableStorageMB`).
function formatStorage(mb: number | null): string {
  if (mb == null || !Number.isFinite(mb)) return "—";
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

function formatAbsolute(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function statusClass(status: DeviceStatus | null): string {
  switch (status) {
    case "ACTIVE":
      return "border-transparent bg-pos-tint text-pos";
    case "LOGGED_OUT":
      return "border-transparent bg-warn-tint text-warn";
    case "PENDING_PAIR":
      return "border-transparent bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400";
    case "DELETED":
      return "border-line bg-canvas text-muted-foreground";
    default:
      return "border-line bg-canvas text-ink-2";
  }
}

function deviceDisplayName(d: Device): string {
  return d.customName || d.name || d.model || "Unnamed device";
}

// ──────────────────────────────────────────────────────────────────────
// Main panel
// ──────────────────────────────────────────────────────────────────────

type DialogMode =
  | { type: "idle" }
  | { type: "pair" }
  | { type: "regenerate"; device: Device }
  | { type: "edit"; device: Device }
  | { type: "details"; device: Device }
  | { type: "logout"; device: Device }
  | { type: "delete"; device: Device };

// Mirror of the backend's seat-counting rule in
// DeviceRepository.countOccupiedSeatsAtAssignment — devices in these states
// do not count against MAX_DEVICES, so the operator can pair a replacement
// without first hard-deleting the old row.
const occupiesSeat = (d: Device): boolean =>
  !d.suspended && d.status !== "LOGGED_OUT" && d.status !== "DELETED";

// Active rows first (suspended last within the active group), then
// PENDING_PAIR, then LOGGED_OUT, then DELETED. Within each group, most
// recently active first so live devices stay near the top.
const STATUS_ORDER: Record<DeviceStatus | "UNKNOWN", number> = {
  ACTIVE: 0,
  PENDING_PAIR: 1,
  LOGGED_OUT: 2,
  DELETED: 3,
  UNKNOWN: 4,
};
const sortDevices = (list: Device[]): Device[] =>
  [...list].sort((a, b) => {
    const aGroup = STATUS_ORDER[a.status ?? "UNKNOWN"] ?? STATUS_ORDER.UNKNOWN;
    const bGroup = STATUS_ORDER[b.status ?? "UNKNOWN"] ?? STATUS_ORDER.UNKNOWN;
    if (aGroup !== bGroup) return aGroup - bGroup;
    // Within ACTIVE, push suspended rows below.
    if (a.status === "ACTIVE" && b.status === "ACTIVE") {
      if (a.suspended !== b.suspended) return a.suspended ? 1 : -1;
    }
    const aSeen = a.lastActiveAt ? Date.parse(a.lastActiveAt) : 0;
    const bSeen = b.lastActiveAt ? Date.parse(b.lastActiveAt) : 0;
    return bSeen - aSeen;
  });

const DeviceSettings = () => {
  const { toast } = useToast();
  const { getEntityItem, loading: entitlementsLoading } = useEntitlements();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [dialog, setDialog] = useState<DialogMode>({ type: "idle" });

  // Resolve the MAX_DEVICES cap for this location. -1 / undefined means
  // unlimited or unknown — both render as "no cap shown".
  const maxDevices = useMemo(() => {
    if (!locationId) return undefined;
    const item = getEntityItem(locationId);
    return item?.limits["MAX_DEVICES"];
  }, [locationId, getEntityItem]);

  const sortedDevices = useMemo(
    () => (devices ? sortDevices(devices) : null),
    [devices],
  );

  const occupiedSeats = useMemo(
    () => devices?.filter(occupiesSeat).length ?? 0,
    [devices],
  );
  const loggedOutCount = useMemo(
    () => devices?.filter((d) => d.status === "LOGGED_OUT").length ?? 0,
    [devices],
  );
  const isUnlimited =
    maxDevices === undefined || maxDevices === -1 || entitlementsLoading;
  const atCapacity =
    !isUnlimited &&
    typeof maxDevices === "number" &&
    occupiedSeats >= maxDevices;

  const refresh = useCallback(
    async (locId: string) => {
      try {
        const res = await listDevices(locId, "LOCATION");
        setDevices(res.content ?? []);
        return res.content ?? [];
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Couldn't load devices",
          description: e instanceof Error ? e.message : "Please try again.",
        });
        setDevices([]);
        return [];
      }
    },
    [toast],
  );

  useEffect(() => {
    (async () => {
      const loc = await getCurrentLocation();
      if (loc?.id) {
        setLocationId(loc.id);
        await refresh(loc.id);
      } else {
        setDevices([]);
      }
    })();
  }, [refresh]);

  // ── Realtime: subscribe to this location's :devices channel ─────────
  // The WS gateway fans LOCATION_DEVICE_CREATED + DEVICE_TELEMETRY (and
  // the existing logout / suspend / unsuspend events) here. We patch
  // heartbeats in-place to keep battery / IP / app-version live without
  // a round-trip, and refetch on lifecycle events that change shape.
  // Refs let the WS callback read the latest list + dialog state
  // without re-binding (which would tear down the subscription on every
  // render).
  const devicesRef = useRef<Device[] | null>(devices);
  const dialogRef = useRef<DialogMode>(dialog);
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);
  useEffect(() => {
    dialogRef.current = dialog;
  }, [dialog]);

  const maybeClosePairDialog = useCallback(
    (fresh: Device[], previous: Device[]) => {
      const current = dialogRef.current;
      if (current.type === "pair") {
        const known = new Set(previous.map((d) => d.id));
        const newDevice = fresh.find((d) => !known.has(d.id));
        if (newDevice) {
          toast({
            title: "Device paired",
            description: `${deviceDisplayName(newDevice)} is now linked to this location.`,
          });
          setDialog({ type: "idle" });
        }
      } else if (current.type === "regenerate") {
        const updated = fresh.find((d) => d.id === current.device.id);
        if (updated && updated.status === "ACTIVE") {
          toast({
            title: "Device re-paired",
            description: `${deviceDisplayName(updated)} is back online.`,
          });
          setDialog({ type: "idle" });
        }
      }
    },
    [toast],
  );

  const handleRealtimeEvent = useCallback(
    (msg: WsMessage<Record<string, unknown>>) => {
      if (!locationId) return;
      const type = msg.type;
      const payload = (msg.payload ?? {}) as Record<string, unknown>;
      const deviceId =
        typeof payload.deviceId === "string" ? payload.deviceId : null;

      // The gateway client fans every frame to every handler — filter to
      // device events for this location and ignore the rest.
      if (msg.locationId && msg.locationId !== locationId) return;

      switch (type) {
        case "DEVICE_HEARTBEAT": {
          if (!deviceId) return;
          const target = devicesRef.current?.find((d) => d.id === deviceId);
          if (!target) {
            // Heartbeat for a device we don't know about yet (race between
            // pair-completion and the API committing the new row). Refetch.
            const previous = devicesRef.current ?? [];
            void refresh(locationId).then((fresh) => {
              maybeClosePairDialog(fresh, previous);
            });
            return;
          }

          setDevices((prev) =>
            prev
              ? prev.map((d) =>
                  d.id === deviceId
                    ? {
                        ...d,
                        batteryLevel:
                          typeof payload.batteryLevel === "number"
                            ? payload.batteryLevel
                            : d.batteryLevel,
                        isCharging:
                          typeof payload.isCharging === "boolean"
                            ? payload.isCharging
                            : d.isCharging,
                        lastIp:
                          typeof payload.ipAddress === "string"
                            ? payload.ipAddress
                            : d.lastIp,
                        availableStorage:
                          typeof payload.availableStorageMB === "number"
                            ? payload.availableStorageMB
                            : d.availableStorage,
                        appVersion:
                          typeof payload.appVersion === "string"
                            ? payload.appVersion
                            : d.appVersion,
                        lastActiveAt:
                          typeof payload.timestamp === "string"
                            ? payload.timestamp
                            : new Date().toISOString(),
                      }
                    : d,
                )
              : prev,
          );

          // A heartbeat from a non-ACTIVE device means it just came back
          // online (e.g., a regenerate flow's target finished re-pairing).
          // Refetch so the status flips and any open dialog closes.
          if (target.status !== "ACTIVE") {
            const previous = devicesRef.current ?? [];
            void refresh(locationId).then((fresh) => {
              maybeClosePairDialog(fresh, previous);
            });
          }
          return;
        }

        case "DEVICE_CREATED":
        case "DEVICE_LOGGED_OUT":
        case "DEVICE_SUSPENDED":
        case "DEVICE_UNSUSPENDED": {
          const previous = devicesRef.current ?? [];
          void refresh(locationId).then((fresh) => {
            if (type === "DEVICE_CREATED") {
              maybeClosePairDialog(fresh, previous);
            }
          });
          return;
        }

        default:
          // Other events arrive over the shared singleton (orders,
          // inventory, etc.). Not ours — ignore.
          return;
      }
    },
    [locationId, refresh, maybeClosePairDialog],
  );

  useRealtimeChannel(
    locationId ? `location:${locationId}:devices` : null,
    handleRealtimeEvent,
  );

  // Fallback polling if the socket gives up. Keeps the panel self-healing
  // even when WS is unreachable. 15 s mirrors the orders bridge.
  const realtimeStatus = useRealtimeStatus();
  useEffect(() => {
    if (!locationId) return;
    if (realtimeStatus !== "fallback" && realtimeStatus !== "disconnected") {
      return;
    }
    const id = setInterval(() => {
      const previous = devicesRef.current ?? [];
      void refresh(locationId).then((fresh) => {
        maybeClosePairDialog(fresh, previous);
      });
    }, 15_000);
    return () => clearInterval(id);
  }, [locationId, realtimeStatus, refresh, maybeClosePairDialog]);

  // While a pairing dialog is open, poll for the device connecting regardless
  // of WS health. The realtime DEVICE_CREATED / heartbeat path closes it
  // faster when those events arrive, but this guarantees the dialog closes and
  // the list refreshes even if the gateway doesn't fan device events to this
  // channel. Scoped to the open dialog, so it's not a constant background poll.
  useEffect(() => {
    if (!locationId) return;
    if (dialog.type !== "pair" && dialog.type !== "regenerate") return;
    const id = setInterval(() => {
      const previous = devicesRef.current ?? [];
      void refresh(locationId).then((fresh) => {
        maybeClosePairDialog(fresh, previous);
      });
    }, 4000);
    return () => clearInterval(id);
  }, [locationId, dialog.type, refresh, maybeClosePairDialog]);

  // Any mutation action returns the updated device; patch it in-place so the
  // list doesn't need a full re-fetch on every action.
  const applyResult = (res: DeviceActionResponse<Device | null>): boolean => {
    if (res.responseType === "error") {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: res.message,
      });
      return false;
    }
    toast({ title: "Done", description: res.message });
    if (res.data && devices) {
      const fresh = res.data;
      setDevices(devices.map((d) => (d.id === fresh.id ? fresh : d)));
    }
    return true;
  };

  const handleDelete = async (id: string) => {
    const res = await deleteDevice(id);
    if (res.responseType === "success" && devices) {
      setDevices(devices.filter((d) => d.id !== id));
      toast({ title: "Done", description: res.message });
    } else if (res.responseType === "error") {
      toast({
        variant: "destructive",
        title: "Couldn't delete device",
        description: res.message,
      });
    }
    setDialog({ type: "idle" });
  };

  // Returned to the row so logout flows through the row's useTransition,
  // matching suspend / unsuspend / PIN — without this the dropdown closes
  // and the user sees no feedback until the toast lands.
  const runLogout = (id: string) => logoutDevice(id);

  const seatSummary = (() => {
    if (entitlementsLoading || devices === null) return null;
    if (isUnlimited) {
      return `${occupiedSeats} of unlimited devices in use`;
    }
    const cap = maxDevices as number;
    return `${occupiedSeats} of ${cap} ${cap === 1 ? "seat" : "seats"} in use`;
  })();

  const pairButtonDisabled = !locationId || atCapacity;
  const pairButton = (
    <Button
      size="sm"
      onClick={() => setDialog({ type: "pair" })}
      disabled={pairButtonDisabled}
    >
      <Plus className="h-3.5 w-3.5" />
      Pair new device
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <PanelHeader
            title="Devices"
            description={
              <>
                Devices linked to this location.
                {seatSummary && (
                  <>
                    {" · "}
                    <span
                      className={atCapacity ? "font-medium text-warn" : ""}
                    >
                      {seatSummary}
                    </span>
                  </>
                )}
                {loggedOutCount > 0 && !isUnlimited && (
                  <>
                    {" · "}
                    <span className="text-muted-foreground">
                      {loggedOutCount} logged-out{" "}
                      {loggedOutCount === 1 ? "device doesn't" : "devices don't"}{" "}
                      count
                    </span>
                  </>
                )}
              </>
            }
          />
          <div className="flex shrink-0 items-center gap-2">
            <SectionTutorialDialog section={TutorialSection.POS_ACCESS} />
            {atCapacity ? (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* span wrapper so the disabled button still fires hover */}
                    <span tabIndex={0}>{pairButton}</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end" className="max-w-xs">
                    You&apos;re at the device cap for this location. Log out an
                    active device to free a seat — its row stays in the list. Or
                    upgrade the plan.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              pairButton
            )}
          </div>
        </div>
        {atCapacity && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-warn/30 bg-warn-tint px-3 py-2 text-[12.5px] leading-snug text-ink-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-warn" />
            <span>
              Device cap reached. Logging out an unused device frees its seat
              without losing its row in the list — then pair a replacement (or
              re-pair the same device) with a new pairing code.
            </span>
          </div>
        )}
      </div>

      {sortedDevices === null ? (
        <DevicesSkeleton />
      ) : sortedDevices.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-[13px] text-muted-foreground">
            No devices paired to this location yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedDevices.map((d) => (
            <DeviceRow
              key={d.id}
              device={d}
              onViewDetails={() => setDialog({ type: "details", device: d })}
              onEdit={() => setDialog({ type: "edit", device: d })}
              onDeleteRequest={() => setDialog({ type: "delete", device: d })}
              onLogoutRequest={() => setDialog({ type: "logout", device: d })}
              onRegenerate={() => setDialog({ type: "regenerate", device: d })}
              onAction={applyResult}
            />
          ))}
        </div>
      )}

      {dialog.type === "pair" && locationId && (
        <PairDeviceDialog
          seatSummary={seatSummary}
          onClose={() => setDialog({ type: "idle" })}
        />
      )}

      {dialog.type === "regenerate" && locationId && (
        <PairDeviceDialog
          existingDevice={dialog.device}
          seatSummary={seatSummary}
          onClose={() => setDialog({ type: "idle" })}
        />
      )}

      {dialog.type === "edit" && (
        <EditDeviceDialog
          device={dialog.device}
          onClose={() => setDialog({ type: "idle" })}
          onSaved={(fresh) => {
            applyResult({
              responseType: "success",
              message: "Device updated",
              data: fresh,
            });
            setDialog({ type: "idle" });
          }}
        />
      )}

      {dialog.type === "details" && (
        <DeviceDetailsDialog
          device={
            devices?.find((d) => d.id === dialog.device.id) ?? dialog.device
          }
          onClose={() => setDialog({ type: "idle" })}
        />
      )}

      {dialog.type === "logout" && (
        <ConfirmLogoutDialog
          device={dialog.device}
          onClose={() => setDialog({ type: "idle" })}
          onConfirm={async () => {
            const res = await runLogout(dialog.device.id);
            applyResult(res);
            setDialog({ type: "idle" });
          }}
        />
      )}

      {dialog.type === "delete" && (
        <ConfirmDeleteDialog
          device={dialog.device}
          onClose={() => setDialog({ type: "idle" })}
          onConfirm={() => handleDelete(dialog.device.id)}
        />
      )}
    </div>
  );
};

export default DeviceSettings;

// ──────────────────────────────────────────────────────────────────────
// Row
// ──────────────────────────────────────────────────────────────────────

function DeviceRow({
  device,
  onViewDetails,
  onEdit,
  onDeleteRequest,
  onLogoutRequest,
  onRegenerate,
  onAction,
}: {
  device: Device;
  onViewDetails: () => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onLogoutRequest: () => void;
  onRegenerate: () => void;
  onAction: (res: DeviceActionResponse<Device>) => boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const Icon = device.isTablet ? Tablet : Smartphone;
  const name = deviceDisplayName(device);

  const runAction = (run: () => Promise<DeviceActionResponse<Device>>) =>
    startTransition(async () => {
      const res = await run();
      onAction(res);
    });

  const status = device.status;
  const isActive = status === "ACTIVE";
  const isLoggedOut = status === "LOGGED_OUT";
  const isPendingPair = status === "PENDING_PAIR";
  const isDeleted = status === "DELETED";
  const hardware = [device.manufacturer || device.brand, device.model]
    .filter(Boolean)
    .join(" · ");
  const osLine = [device.os, device.osVersion].filter(Boolean).join(" ");
  const appLine = device.appVersion ? `App v${device.appVersion}` : null;

  // Logged-out rows are visually de-emphasised — they're a free seat the
  // operator might either let the same device return to, or replace.
  const cardClass = isDeleted
    ? "opacity-60"
    : isLoggedOut
      ? "border-dashed bg-canvas/60"
      : undefined;

  return (
    <Card className={cardClass}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-line bg-canvas">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="link"
                onClick={onViewDetails}
                className="h-auto min-w-0 max-w-full justify-start p-0 text-sm font-medium text-ink hover:text-primary"
              >
                <span className="truncate">{name}</span>
              </Button>
              {/* Custom name replaces the device name as the title, but venues
                  with several identical-model tablets need BOTH to tell units
                  apart — so keep the hardware name visible beside it. */}
              {device.customName &&
                (device.name || device.model) &&
                (device.name || device.model) !== device.customName && (
                  <span className="truncate text-sm text-muted-foreground">
                    {device.name || device.model}
                  </span>
                )}
              {status && (
                <Badge
                  variant="outline"
                  className={statusClass(status)}
                  title={DEVICE_STATUS_DESCRIPTIONS[status]}
                >
                  {DEVICE_STATUS_LABELS[status] ?? status}
                </Badge>
              )}
              {isLoggedOut && (
                <Badge
                  variant="pos"
                  title="This row no longer counts against your MAX_DEVICES cap."
                >
                  Seat free
                </Badge>
              )}
              {device.suspended && (
                <Badge
                  variant="neg"
                  title="Admin has paused this device. Tokens are rejected until unsuspended."
                >
                  Suspended
                </Badge>
              )}
              {device.pinRequired && !isDeleted && (
                <Badge variant="soft">PIN required</Badge>
              )}
            </div>

            <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-0.5">
              {hardware && <span className="truncate">{hardware}</span>}
              {osLine && <span className="truncate">{osLine}</span>}
              {appLine && <span className="truncate">{appLine}</span>}
              {device.serialNumber && (
                <span className="truncate">
                  S/N: <span className="font-mono">{device.serialNumber}</span>
                </span>
              )}
              <span>Last seen: {formatRelative(device.lastActiveAt)}</span>
              {device.lastIp && (
                <span className="truncate">
                  IP: <span className="font-mono">{device.lastIp}</span>
                </span>
              )}
              {device.pairedAt && (
                <span>Paired: {formatRelative(device.pairedAt)}</span>
              )}
              {device.batteryLevel != null && (
                <span className="inline-flex items-center gap-1">
                  {device.isCharging ? (
                    <BatteryCharging className="h-3.5 w-3.5" />
                  ) : (
                    <Battery className="h-3.5 w-3.5" />
                  )}
                  {device.batteryLevel}%
                </span>
              )}
              {device.availableStorage != null && (
                <span className="truncate">
                  Storage: {formatStorage(device.availableStorage)} free
                </span>
              )}
            </div>

            {isLoggedOut && (
              <p className="mt-2 text-[11px] text-muted-foreground italic">
                Free seat. Generate a new pairing code to bring this device — or
                a different one — back online here.
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending || isDeleted}
                aria-label="Manage device"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Manage device</DropdownMenuLabel>

              <DropdownMenuItem onClick={onViewDetails}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                Edit name & department
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  runAction(() =>
                    updateDevicePinRequired(device.id, !device.pinRequired),
                  )
                }
              >
                {device.pinRequired
                  ? "Don't require PIN"
                  : "Require PIN to unlock"}
              </DropdownMenuItem>

              {(isLoggedOut || isPendingPair) && (
                <DropdownMenuItem onClick={onRegenerate}>
                  Generate pairing code
                </DropdownMenuItem>
              )}

              {device.suspended ? (
                <DropdownMenuItem
                  onClick={() => runAction(() => unsuspendDevice(device.id))}
                >
                  Unsuspend · restore access
                </DropdownMenuItem>
              ) : (
                !isLoggedOut && (
                  <DropdownMenuItem
                    onClick={() => runAction(() => suspendDevice(device.id))}
                  >
                    Suspend · pause access
                  </DropdownMenuItem>
                )
              )}

              {isActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-neg focus:text-neg"
                    onClick={onLogoutRequest}
                  >
                    Log out · free this seat
                  </DropdownMenuItem>
                </>
              )}

              {isLoggedOut && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-neg focus:text-neg"
                    onClick={onDeleteRequest}
                  >
                    Delete from list
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Pair dialog — generate a code and wait for the device to authenticate.
// Detection runs in the parent over the location's :devices WS channel:
// on LOCATION_DEVICE_CREATED (new pair) or DEVICE_TELEMETRY for the
// regenerate target, the parent refetches and closes this dialog.
// ──────────────────────────────────────────────────────────────────────

function PairDeviceDialog({
  existingDevice,
  seatSummary,
  onClose,
}: {
  existingDevice?: Device;
  seatSummary?: string | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const isRegenerate = !!existingDevice;
  const [step, setStep] = useState<"configure" | "waiting">(
    isRegenerate ? "waiting" : "configure",
  );
  const [deviceName, setDeviceName] = useState(
    existingDevice?.customName ?? existingDevice?.name ?? "",
  );
  const [pinRequired, setPinRequired] = useState(
    existingDevice?.pinRequired ?? true,
  );
  const [code, setCode] = useState<PairingCode | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [isGenerating, startGenerating] = useTransition();
  const [copied, setCopied] = useState(false);
  const targetName = existingDevice ? deviceDisplayName(existingDevice) : null;

  // Countdown
  useEffect(() => {
    if (step !== "waiting" || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [step, remaining]);

  const generate = useCallback(
    () =>
      startGenerating(async () => {
        const res = await generatePairingCode({
          deviceName: deviceName.trim() || undefined,
          pinRequired,
        });
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't generate code",
            description: res.message,
          });
          return;
        }
        setCode(res.data);
        setRemaining(res.data.expiresInSeconds ?? 600);
        setStep("waiting");
      }),
    [deviceName, pinRequired, toast],
  );

  // Auto-generate on open when regenerating an existing device's code.
  const autoGenRef = useRef(false);
  useEffect(() => {
    if (!isRegenerate || autoGenRef.current) return;
    autoGenRef.current = true;
    generate();
  }, [isRegenerate, generate]);

  const handleCopy = () => {
    if (!code?.code) return;
    navigator.clipboard.writeText(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expired = step === "waiting" && code !== null && remaining <= 0;
  const preparing = step === "waiting" && code === null;

  const waitingTitle = expired
    ? "Code expired"
    : preparing
      ? "Generating pairing code…"
      : isRegenerate
        ? `Re-pair ${targetName ?? "device"}`
        : "Enter this code on the device";

  const waitingDescription = expired
    ? "Pairing codes are valid for a limited time. Issue a new one to continue."
    : preparing
      ? "Hang tight — this only takes a moment."
      : isRegenerate
        ? `Open the Settlo app on ${targetName ?? "the device"} and enter the code below to bring it back online.`
        : "Open the Settlo app on the new device and enter the code below.";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {step === "configure" ? (
          <>
            <DialogHeader>
              <DialogTitle>Pair a new device</DialogTitle>
              <DialogDescription>
                Generate a pairing code to enter on the device during setup.
                {seatSummary && (
                  <span className="block mt-1 text-xs text-muted-foreground">
                    {seatSummary}.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Field
                label="Device name"
                optional
                hint="Shown in place of the device-reported name. You can change this later."
              >
                {(id) => (
                  <ControlInput
                    id={id}
                    maxLength={100}
                    prefix={<Tag className="h-3.5 w-3.5" />}
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g. Bar POS 1"
                    disabled={isGenerating}
                  />
                )}
              </Field>
              <ToggleRow
                label="Require PIN to unlock"
                hint="Staff must enter their PIN each time the device opens."
                checked={pinRequired}
                onChange={setPinRequired}
                disabled={isGenerating}
              />
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isGenerating}
              >
                Cancel
              </Button>

              <Button onClick={generate} disabled={isGenerating}>
                {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isGenerating ? "Generating…" : "Generate code"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{waitingTitle}</DialogTitle>
              <DialogDescription>{waitingDescription}</DialogDescription>
            </DialogHeader>

            <div className="py-4 flex flex-col items-center gap-3">
              {preparing ? (
                <div className="flex items-center justify-center h-24 w-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex items-stretch gap-2 w-full">
                    {(code?.code ?? "").split("").map((ch, i) => (
                      <span
                        key={i}
                        className="flex aspect-square flex-1 select-all items-center justify-center rounded-xl border-2 border-line bg-canvas font-mono text-2xl font-bold text-ink sm:text-4xl"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!code?.code}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-pos" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied" : "Copy code"}
                  </Button>

                  {expired ? (
                    <p className="text-xs font-medium text-neg">Code expired</p>
                  ) : (
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Waiting for the device to connect · expires in{" "}
                      {formatCountdown(remaining)}
                    </p>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {expired && (
                <Button onClick={generate} disabled={isGenerating}>
                  {isGenerating && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {isGenerating ? "Generating…" : "Generate a new code"}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ──────────────────────────────────────────────────────────────────────
// Device details — full read-only view of everything we hold for a device.
// The parent passes the live row from `devices`, so heartbeat patches
// (battery, storage, last-seen) update here in place while it's open.
// ──────────────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  /** Tabular-mono for ids, serials and addresses. */
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="flex-shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "break-all text-right text-xs font-medium text-ink",
          mono && "font-mono",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
        {title}
      </p>
      <div className="divide-y divide-line rounded-md border border-line bg-card px-3">
        {children}
      </div>
    </div>
  );
}

function DeviceDetailsDialog({
  device,
  onClose,
}: {
  device: Device;
  onClose: () => void;
}) {
  const name = deviceDisplayName(device);
  const Icon = device.isTablet ? Tablet : Smartphone;
  const dash = (v: string | number | null | undefined): string =>
    v === null || v === undefined || v === "" ? "—" : String(v);
  const osLine = [device.os, device.osVersion].filter(Boolean).join(" ");
  const hasSystem =
    device.buildNumber != null ||
    device.apiLevel != null ||
    device.firstInstallTime != null ||
    device.timezone != null ||
    device.deviceLocale != null ||
    device.isEmulator != null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {name}
          </DialogTitle>
          <DialogDescription>
            {device.status
              ? DEVICE_STATUS_DESCRIPTIONS[device.status]
              : "Full device details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <DetailSection title="Status">
            <DetailRow
              label="Status"
              value={
                device.status
                  ? (DEVICE_STATUS_LABELS[device.status] ?? device.status)
                  : "—"
              }
            />
            <DetailRow
              label="Suspended"
              value={device.suspended ? "Yes" : "No"}
            />
            <DetailRow
              label="PIN required"
              value={device.pinRequired ? "Yes" : "No"}
            />
            <DetailRow label="Assignment" value={dash(device.assignmentType)} />
          </DetailSection>

          <DetailSection title="Live telemetry">
            <DetailRow
              label="Battery"
              value={
                device.batteryLevel != null ? (
                  <span className="inline-flex items-center gap-1">
                    {device.isCharging ? (
                      <BatteryCharging className="h-3.5 w-3.5" />
                    ) : (
                      <Battery className="h-3.5 w-3.5" />
                    )}
                    {device.batteryLevel}%
                    {device.isCharging ? " · charging" : ""}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow
              label="Free storage"
              value={formatStorage(device.availableStorage)}
            />
            <DetailRow
              label="Last seen"
              value={
                device.lastActiveAt
                  ? `${formatRelative(device.lastActiveAt)} · ${formatAbsolute(device.lastActiveAt)}`
                  : "—"
              }
            />
            <DetailRow label="Last IP" value={dash(device.lastIp)} mono />
            <DetailRow
              label="App version"
              value={dash(device.appVersion)}
              mono
            />
          </DetailSection>

          <DetailSection title="Hardware">
            <DetailRow label="Type" value={dash(device.deviceType)} />
            <DetailRow label="Manufacturer" value={dash(device.manufacturer)} />
            <DetailRow label="Brand" value={dash(device.brand)} />
            <DetailRow label="Model" value={dash(device.model)} />
            <DetailRow label="OS" value={dash(osLine || null)} />
            <DetailRow
              label="Serial number"
              value={dash(device.serialNumber)}
              mono
            />
            {device.ramInGB != null && (
              <DetailRow
                label="RAM"
                value={`${device.ramInGB.toFixed(1)} GB`}
              />
            )}
            {device.storageInGB != null && (
              <DetailRow
                label="Total storage"
                value={`${device.storageInGB.toFixed(1)} GB`}
              />
            )}
            {device.batteryInMah != null && (
              <DetailRow
                label="Battery capacity"
                value={`${device.batteryInMah} mAh`}
              />
            )}
            {device.processor && (
              <DetailRow label="Processor" value={device.processor} />
            )}
            {device.displayResolution && (
              <DetailRow label="Display" value={device.displayResolution} />
            )}
            {device.imei && (
              <DetailRow label="IMEI" value={device.imei} mono />
            )}
            {device.macAddress && (
              <DetailRow label="MAC address" value={device.macAddress} mono />
            )}
          </DetailSection>

          {hasSystem && (
            <DetailSection title="System">
              {device.buildNumber && (
                <DetailRow label="Build" value={device.buildNumber} mono />
              )}
              {device.apiLevel != null && (
                <DetailRow label="API level" value={String(device.apiLevel)} />
              )}
              {device.firstInstallTime && (
                <DetailRow
                  label="First install"
                  value={formatAbsolute(device.firstInstallTime)}
                />
              )}
              {device.timezone && (
                <DetailRow label="Timezone" value={device.timezone} />
              )}
              {device.deviceLocale && (
                <DetailRow label="Locale" value={device.deviceLocale} />
              )}
              {device.isEmulator != null && (
                <DetailRow
                  label="Emulator"
                  value={device.isEmulator ? "Yes" : "No"}
                />
              )}
            </DetailSection>
          )}

          <DetailSection title="Lifecycle">
            <DetailRow label="Paired" value={formatAbsolute(device.pairedAt)} />
            <DetailRow
              label="First added"
              value={formatAbsolute(device.createdAt)}
            />
            <DetailRow
              label="Last updated"
              value={formatAbsolute(device.updatedAt)}
            />
          </DetailSection>

          <DetailSection title="Identifiers">
            <DetailRow
              label="Device name (reported)"
              value={dash(device.name)}
            />
            <DetailRow label="Device ID" value={dash(device.id)} mono />
            <DetailRow
              label="Fingerprint"
              value={dash(device.fingerprint)}
              mono
            />
          </DetailSection>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Edit dialog — customName + departmentId (PATCH /api/v1/devices/{id})
// ──────────────────────────────────────────────────────────────────────

function EditDeviceDialog({
  device,
  onClose,
  onSaved,
}: {
  device: Device;
  onClose: () => void;
  onSaved: (fresh: Device) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [customName, setCustomName] = useState(device.customName ?? "");
  const [departmentId, setDepartmentId] = useState<string>(
    device.departmentId ?? "",
  );

  const patch = useMemo(() => {
    const p: { customName?: string | null; departmentId?: string | null } = {};
    const trimmedName = customName.trim();
    const baselineName = device.customName ?? "";
    if (trimmedName !== baselineName) {
      p.customName = trimmedName === "" ? null : trimmedName;
    }
    const baselineDept = device.departmentId ?? "";
    if (departmentId !== baselineDept) {
      p.departmentId = departmentId === "" ? null : departmentId;
    }
    return p;
  }, [customName, departmentId, device.customName, device.departmentId]);

  const isDirty = Object.keys(patch).length > 0;

  const save = () => {
    if (!isDirty) return;
    startTransition(async () => {
      const res = await updateDevice(device.id, patch);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't save device",
          description: res.message,
        });
        return;
      }
      onSaved(res.data);
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit device</DialogTitle>
          <DialogDescription>
            Rename this device and assign it to a department.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field
            label="Custom name"
            hint="Shown in place of the device-reported name. Max 100 characters."
          >
            {(id) => (
              <ControlInput
                id={id}
                maxLength={100}
                prefix={<Tag className="h-3.5 w-3.5" />}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={device.name ?? "Bar POS 1"}
                disabled={isPending}
              />
            )}
          </Field>

          {/* DepartmentSelector owns its own trigger, so the label sits
              beside it rather than inside a StandaloneField render-prop. */}
          <div className="min-w-0 space-y-[7px]">
            <label className={standaloneLabelClass}>Department</label>
            <DepartmentSelector
              value={departmentId || undefined}
              onChange={(v) => setDepartmentId(v)}
              isDisabled={isPending}
              placeholder="Select a department"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!isDirty || isPending}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Logout confirmation
// ──────────────────────────────────────────────────────────────────────
//
// Logout was a single dropdown click in the previous version, but with the
// new seat-counting rule it carries a deliberate side-effect — the seat
// frees, which is usually what the operator wants but worth confirming.
// Mirrors the existing delete-confirmation pattern.

function ConfirmLogoutDialog({
  device,
  onClose,
  onConfirm,
}: {
  device: Device;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const name = deviceDisplayName(device);

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent tone="danger">
        <AlertDialogIcon>
          <LogOut className="h-5 w-5" />
        </AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>Log out {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Tokens are revoked immediately and the device stops syncing.
            <span className="mt-2 block">
              The seat frees up right away. The row stays in the list — to bring
              this device back online (or pair a replacement on the same seat),
              generate a new pairing code.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Keep signed in
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            // preventDefault keeps the dialog open while the request runs —
            // the parent closes it once the action resolves, so the pending
            // spinner stays visible exactly as before.
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await onConfirm();
              });
            }}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? "Logging out…" : "Log out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Delete dialog
// ──────────────────────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  device,
  onClose,
  onConfirm,
}: {
  device: Device;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const name = deviceDisplayName(device);

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent tone="danger">
        <AlertDialogIcon>
          <Trash2 className="h-5 w-5" />
        </AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name} from the list?</AlertDialogTitle>
          <AlertDialogDescription>
            This hides the row from the device list. The seat is already free
            because the device is logged out — delete only if you don&apos;t
            want this entry around anymore.
            <span className="mt-2 block text-xs">
              Audit history is preserved either way. Re-pairing the same
              hardware after this will create a brand new entry rather than
              bringing this row back.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Keep in list
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            // preventDefault keeps the dialog mounted for the pending state;
            // the parent's handler closes it when the delete resolves.
            onClick={(e) => {
              e.preventDefault();
              startTransition(() => onConfirm());
            }}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? "Deleting…" : "Delete from list"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Skeleton
// ──────────────────────────────────────────────────────────────────────

function DevicesSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-4">
            <Skeleton className="h-11 w-11 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
