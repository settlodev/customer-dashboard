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
import { useToast } from "@/hooks/use-toast";

import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import {
  activateDevice,
  archiveDevice,
  deactivateDevice,
  deleteDevice,
  generatePairingCode,
  listDevices,
  logoutDevice,
  retireDevice,
  suspendDevice,
  unsuspendDevice,
  updateDevice,
  updateDevicePinRequired,
  type DeviceActionResponse,
  type PairingCode,
} from "@/lib/actions/devices-actions";
import type { Device, DeviceStatus } from "@/types/device/type";
import { DEVICE_STATUS_LABELS } from "@/types/device/type";

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
    case "INACTIVE":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "ARCHIVED":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "RETIRED":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "REVOKED":
      return "bg-red-100 text-red-800 border-red-200";
    case "PENDING_PAIRING":
      return "bg-blue-100 text-blue-800 border-blue-200";
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

  const handleLogout = async (id: string) => {
    const res = await logoutDevice(id);
    applyResult(res);
  };

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
              onLogout={() => handleLogout(d.id)}
              onAction={applyResult}
            />
          ))}
        </div>
      )}

      {dialog.type === "pair" && locationId && (
        <PairDeviceDialog
          locationId={locationId}
          knownIds={new Set((devices ?? []).map((d) => d.id))}
          onClose={() => setDialog({ type: "idle" })}
          onPaired={(fresh) => {
            setDevices(fresh);
            setDialog({ type: "idle" });
          }}
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
  onAction,
}: {
  device: Device;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onLogout: () => void;
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

  const isActive = device.status === "ACTIVE";
  const hardware = [device.manufacturer || device.brand, device.model]
    .filter(Boolean)
    .join(" · ");
  const osLine = [device.os, device.osVersion].filter(Boolean).join(" ");
  const appLine = device.appVersion ? `App v${device.appVersion}` : null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-gray-500" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium truncate">{name}</p>
              {device.status && (
                <Badge variant="outline" className={statusClass(device.status)}>
                  {DEVICE_STATUS_LABELS[device.status] ?? device.status}
                </Badge>
              )}
              {device.suspended && (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  Suspended
                </Badge>
              )}
              {device.pinRequired && (
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
              <Button variant="ghost" size="icon" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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

              <DropdownMenuSeparator />
              {isActive ? (
                <DropdownMenuItem
                  onClick={() => runAction(() => deactivateDevice(device.id))}
                >
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => runAction(() => activateDevice(device.id))}
                >
                  Activate
                </DropdownMenuItem>
              )}
              {device.suspended ? (
                <DropdownMenuItem
                  onClick={() => runAction(() => unsuspendDevice(device.id))}
                >
                  Unsuspend
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => runAction(() => suspendDevice(device.id))}
                >
                  Suspend
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => runAction(() => archiveDevice(device.id))}
              >
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => runAction(() => retireDevice(device.id))}
              >
                Retire
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>Log out</DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700"
                onClick={onDeleteRequest}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Pair dialog — generate a code + poll the accounts service until the
// mobile device finishes pairing (it pops into the list via Kafka sync).
// ──────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 4000;

function PairDeviceDialog({
  locationId,
  knownIds,
  onClose,
  onPaired,
}: {
  locationId: string;
  knownIds: Set<string>;
  onClose: () => void;
  onPaired: (fresh: Device[]) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<"configure" | "waiting">("configure");
  const [deviceName, setDeviceName] = useState("");
  const [pinRequired, setPinRequired] = useState(true);
  const [code, setCode] = useState<PairingCode | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [isGenerating, startGenerating] = useTransition();
  const [copied, setCopied] = useState(false);
  const knownIdsRef = useRef(knownIds);
  knownIdsRef.current = knownIds;

  // Countdown
  useEffect(() => {
    if (step !== "waiting" || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [step, remaining]);

  // Poll for the new device to appear in the list
  useEffect(() => {
    if (step !== "waiting" || remaining <= 0) return;
    let cancelled = false;
    const id = setInterval(async () => {
      try {
        const res = await listDevices(locationId, "LOCATION");
        if (cancelled) return;
        const fresh = res.content ?? [];
        const newDevice = fresh.find((d) => !knownIdsRef.current.has(d.id));
        if (newDevice) {
          toast({
            title: "Device paired",
            description: `${deviceDisplayName(newDevice)} is now linked to this location.`,
          });
          onPaired(fresh);
        }
      } catch {
        // Silent — transient errors shouldn't spam toasts during polling.
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [step, remaining, locationId, onPaired, toast]);

  const generate = () =>
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
    });

  const handleCopy = () => {
    if (!code?.code) return;
    navigator.clipboard.writeText(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expired = step === "waiting" && remaining <= 0;

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
              <DialogTitle>
                {expired ? "Code expired" : "Enter this code on the device"}
              </DialogTitle>
              <DialogDescription>
                {expired
                  ? "Pairing codes are valid for a limited time. Generate a new one to continue."
                  : "Open the Settlo app on the new device and enter the code below."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 flex flex-col items-center gap-3">
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
            access immediately and removes it from this list. The device will
            need to be paired again from scratch.
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
