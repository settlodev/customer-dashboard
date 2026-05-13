"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Battery,
  BatteryCharging,
  Check,
  Copy,
  Loader2,
  MoreHorizontal,
  Plus,
  Smartphone,
  Tablet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import DepartmentSelector from "@/components/widgets/department-selector";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { useRealtimeStatus } from "@/hooks/use-realtime-status";
import { useToast } from "@/hooks/use-toast";
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

function statusClass(status: DeviceStatus | null): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "LOGGED_OUT":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "PENDING_PAIR":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "DELETED":
      return "bg-gray-100 text-gray-500 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
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
  | { type: "delete"; device: Device };

const DeviceSettings = () => {
  const { toast } = useToast();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [dialog, setDialog] = useState<DialogMode>({ type: "idle" });

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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Devices
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Devices linked to this location.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setDialog({ type: "pair" })}
            disabled={!locationId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Pair new device
          </Button>
        </div>
      </div>

      {devices === null ? (
        <DevicesSkeleton />
      ) : devices.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No devices paired to this location yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {devices.map((d) => (
            <DeviceRow
              key={d.id}
              device={d}
              onEdit={() => setDialog({ type: "edit", device: d })}
              onDeleteRequest={() => setDialog({ type: "delete", device: d })}
              onLogout={() => runLogout(d.id)}
              onRegenerate={() => setDialog({ type: "regenerate", device: d })}
              onAction={applyResult}
            />
          ))}
        </div>
      )}

      {dialog.type === "pair" && locationId && (
        <PairDeviceDialog onClose={() => setDialog({ type: "idle" })} />
      )}

      {dialog.type === "regenerate" && locationId && (
        <PairDeviceDialog
          existingDevice={dialog.device}
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
  onEdit,
  onDeleteRequest,
  onLogout,
  onRegenerate,
  onAction,
}: {
  device: Device;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onLogout: () => Promise<DeviceActionResponse<Device>>;
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

  return (
    <Card className={isDeleted ? "opacity-60" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-gray-500" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium truncate">{name}</p>
              {status && (
                <Badge
                  variant="outline"
                  className={statusClass(status)}
                  title={DEVICE_STATUS_DESCRIPTIONS[status]}
                >
                  {DEVICE_STATUS_LABELS[status] ?? status}
                </Badge>
              )}
              {device.suspended && (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                  title="Admin has paused this device. Tokens are rejected until unsuspended."
                >
                  Suspended
                </Badge>
              )}
              {device.pinRequired && !isDeleted && (
                <Badge variant="outline" className="text-muted-foreground">
                  PIN required
                </Badge>
              )}
            </div>

            <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-0.5">
              {hardware && <span className="truncate">{hardware}</span>}
              {osLine && <span className="truncate">{osLine}</span>}
              {appLine && <span className="truncate">{appLine}</span>}
              {device.serialNumber && (
                <span className="truncate">S/N: {device.serialNumber}</span>
              )}
              <span>Last seen: {formatRelative(device.lastActiveAt)}</span>
              {device.lastIp && <span>IP: {device.lastIp}</span>}
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
            </div>
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
                  Regenerate pairing code
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
                    className="text-red-600 focus:text-red-700"
                    onClick={() => runAction(onLogout)}
                  >
                    Log out · force re-sign-in
                  </DropdownMenuItem>
                </>
              )}

              {isLoggedOut && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700"
                    onClick={onDeleteRequest}
                  >
                    Delete
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
  onClose,
}: {
  existingDevice?: Device;
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
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="pair-name">Device name (optional)</Label>
                <Input
                  id="pair-name"
                  maxLength={100}
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. Bar POS 1"
                  disabled={isGenerating}
                />
                <p className="text-[11px] text-muted-foreground">
                  Shown in place of the device-reported name. You can change
                  this later.
                </p>
              </div>
              <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Require PIN to unlock</p>
                  <p className="text-xs text-muted-foreground">
                    Staff must enter their PIN each time the device opens.
                  </p>
                </div>
                <Switch
                  checked={pinRequired}
                  onCheckedChange={setPinRequired}
                  disabled={isGenerating}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isGenerating}>
                Cancel
              </Button>
              <Button onClick={generate} disabled={isGenerating}>
                {isGenerating && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Generate code
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
                        className="flex-1 aspect-square flex items-center justify-center text-4xl font-mono font-bold rounded-xl border-2 bg-gray-50 dark:bg-gray-800 select-all"
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
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copied ? "Copied" : "Copy code"}
                  </Button>

                  {expired ? (
                    <p className="text-xs text-red-600">Code expired</p>
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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Generate a new code
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
          <div className="space-y-1.5">
            <Label htmlFor="device-name">Custom name</Label>
            <Input
              id="device-name"
              maxLength={100}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={device.name ?? "Bar POS 1"}
              disabled={isPending}
            />
            <p className="text-[11px] text-muted-foreground">
              Shown in place of the device-reported name. Max 100 characters.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Department</Label>
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
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete device?</DialogTitle>
          <DialogDescription>
            Deleting <span className="font-medium">{name}</span> revokes its
            tokens immediately and removes it from this list. The device&apos;s
            history is preserved — pairing the same hardware again brings the
            row back rather than starting fresh.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Keep device
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => startTransition(() => onConfirm())}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
