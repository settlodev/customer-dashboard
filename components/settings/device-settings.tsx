"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  Smartphone,
  Tablet,
  Key,
  LogOut,
  Plus,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
  BatteryCharging,
  Battery,
  Globe,
  RefreshCw,
  Trash2,
  MoreVertical,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Device } from "@/types/device/type";
import {
  listAllDevices,
  logoutDevice,
  deleteDevice,
  suspendDevice,
  addDevice,
  regenerateDeviceCode,
} from "@/lib/actions/devices-actions";

const DeviceSettings = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add/code dialog — single dialog with two steps
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<"name" | "code">("name");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [codeDeviceName, setCodeDeviceName] = useState("");
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [validityMinutes, setValidityMinutes] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Regenerate state
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Logout state
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [deviceToLogout, setDeviceToLogout] = useState<Device | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // Delete state
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Detail view state
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const { toast } = useToast();

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listAllDevices();
      setDevices(response);
    } catch (err) {
      console.error("Failed to load devices:", err);
      setError(err instanceof Error ? err.message : "Failed to load devices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  // Code expiry countdown
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        stopPolling();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Poll for device connection when code modal is open
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceCodeRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback((code: string) => {
    stopPolling();
    deviceCodeRef.current = code;

    pollingRef.current = setInterval(async () => {
      try {
        const freshDevices = await listAllDevices();
        // Device connected: has a serialNumber and its loginCode matches the generated code
        const connected = freshDevices.find(
          (d) => d.loginCode === deviceCodeRef.current && d.serialNumber
        );
        if (connected) {
          stopPolling();
          setShowDeviceDialog(false);
          setDeviceCode(null);
          setExpiresAt(null);
          setTimeRemaining(0);
          setCopied(false);
          setCodeDeviceName("");
          setDevices(freshDevices);
          toast({
            variant: "success",
            title: "Device Connected",
            description: `${connected.customName || connected.name} is now online`,
          });
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);
  }, [stopPolling, toast]);

  // Clean up polling on unmount or when dialog closes
  useEffect(() => {
    if (!showDeviceDialog || dialogStep !== "code") {
      stopPolling();
    }
    return () => stopPolling();
  }, [showDeviceDialog, dialogStep, stopPolling]);

  const openAddDialog = () => {
    setNewDeviceName("");
    setAddError(null);
    setDialogStep("name");
    setShowDeviceDialog(true);
  };

  const transitionToCode = (name: string, data: { code: string; expiresAt: string; validityMinutes: number }) => {
    setCodeDeviceName(name);
    setDeviceCode(data.code);
    setExpiresAt(data.expiresAt);
    setValidityMinutes(data.validityMinutes);
    setCopied(false);
    setDialogStep("code");
    setShowDeviceDialog(true);
    startPolling(data.code);
  };

  const handleAddDevice = async () => {
    const name = newDeviceName.trim();
    if (!name) return;

    setIsAdding(true);
    setAddError(null);

    try {
      const result = await addDevice(name);
      if (result.success && result.data) {
        transitionToCode(name, result.data);
        loadDevices();
      } else {
        setAddError(result.error ?? "Failed to add device");
      }
    } catch {
      setAddError("Unexpected error occurred");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRegenerateCode = async (device: Device) => {
    setRegeneratingId(device.id);
    try {
      const result = await regenerateDeviceCode(device.id);
      if (result.success && result.data) {
        transitionToCode(device.customName || device.name, result.data);
        loadDevices();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error ?? "Failed to regenerate code",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to regenerate code",
      });
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleCopyCode = async () => {
    if (deviceCode) {
      await navigator.clipboard.writeText(deviceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseDeviceDialog = () => {
    stopPolling();
    setShowDeviceDialog(false);
    setDeviceCode(null);
    setExpiresAt(null);
    setTimeRemaining(0);
    setCopied(false);
    setCodeDeviceName("");
    setNewDeviceName("");
    setAddError(null);
  };

  const handleLogoutClick = (device: Device) => {
    setDeviceToLogout(device);
    setLogoutError(null);
    setShowLogoutAlert(true);
  };

  const confirmLogout = async () => {
    if (!deviceToLogout) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      const result = await logoutDevice(deviceToLogout.id);
      if (result.success) {
        setShowLogoutAlert(false);
        setDeviceToLogout(null);
        toast({
          variant: "success",
          title: "Success",
          description: "Device logged out successfully",
        });
        loadDevices();
      } else {
        setLogoutError(result.error ?? "Something went wrong");
      }
    } catch {
      setLogoutError("Unexpected error occurred");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSuspendToggle = async (device: Device) => {
    const newState = !device.suspended;
    try {
      const result = await suspendDevice(device.id, newState);
      if (result.success) {
        toast({
          variant: "success",
          title: "Success",
          description: newState
            ? "Device data access suspended"
            : "Device data access restored",
        });
        loadDevices();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error ?? "Failed to update device",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update device",
      });
    }
  };

  const handleDeleteClick = (device: Device) => {
    setDeviceToDelete(device);
    setDeleteError(null);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!deviceToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteDevice(deviceToDelete.id);
      if (result.success) {
        setShowDeleteAlert(false);
        setDeviceToDelete(null);
        toast({
          variant: "success",
          title: "Success",
          description: "Device deleted successfully",
        });
        loadDevices();
      } else {
        setDeleteError(result.error ?? "Something went wrong");
      }
    } catch {
      setDeleteError("Unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isDeviceOnline = (device: Device) => {
    return device.firebaseToken !== null && device.loginCode !== null;
  };

  const isDevicePending = (device: Device) => {
    // Device was created from dashboard but not yet registered by the mobile app
    return device.loginCode !== null && device.firebaseToken === null && !device.serialNumber;
  };

  const getDeviceIcon = (device: Device) => {
    if (device.isTablet) return Tablet;
    if (device.deviceType === "Tablet") return Tablet;
    return Smartphone;
  };

  const getDeviceStatus = (device: Device) => {
    if (isDeviceOnline(device)) return { label: "Online", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" };
    if (isDevicePending(device)) return { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" };
    return { label: "Offline", color: "", dot: "bg-gray-300" };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Devices
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Loading devices...</p>
        </div>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Devices</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage devices connected to your location</p>
        </div>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadDevices} variant="outline" className="rounded-lg">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Devices</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage devices connected to your location</p>
        </div>
        <Button
          size="sm"
          onClick={openAddDialog}
          className="rounded-lg bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>

      {/* Device List */}
      {devices.length === 0 ? (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-4">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">No devices yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Add a device by giving it a name. You&apos;ll get a code to enter on the POS device.
            </p>
            <Button
              onClick={openAddDialog}
              className="rounded-lg bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="pt-6 space-y-1">
            {devices.map((device, index) => {
              const DeviceIcon = getDeviceIcon(device);
              const online = isDeviceOnline(device);
              const pending = isDevicePending(device);
              const status = getDeviceStatus(device);

              return (
                <React.Fragment key={device.id}>
                  <div
                    className="flex items-center justify-between px-3 py-4 rounded-lg hover:bg-primary-light dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 dark:bg-gray-800 flex-shrink-0 relative">
                        <DeviceIcon className="h-5 w-5 text-primary" />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${status.dot}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {device.customName || device.name || "Unnamed Device"}
                          </span>
                          {device.isEmulator && (
                            <Badge variant="outline" className="text-xs">Emulator</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {pending ? (
                            <span className="text-xs text-amber-600 dark:text-amber-400">Waiting for device to connect...</span>
                          ) : (
                            <>
                              <span className="text-xs text-muted-foreground">
                                {[device.brand || device.manufacturer, device.model].filter(Boolean).join(" ") || "Unknown device"}
                              </span>
                              {device.operatingSystem && (
                                <span className="text-xs text-muted-foreground">
                                  · {device.operatingSystem} {device.operatingSystemVersion}
                                </span>
                              )}
                              {device.appVersion && (
                                <span className="text-xs text-muted-foreground">· v{device.appVersion}</span>
                              )}
                            </>
                          )}
                        </div>
                        {/* Extra details row */}
                        {!pending && (
                          <div className="flex items-center gap-3 mt-1">
                            {device.batteryLevel != null && device.batteryLevel > 0 && (
                              <div className="flex items-center gap-1">
                                {device.isCharging ? (
                                  <BatteryCharging className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Battery className={`h-3 w-3 ${device.batteryLevel < 0.2 ? "text-red-500" : "text-muted-foreground"}`} />
                                )}
                                <span className={`text-xs ${device.batteryLevel < 0.2 ? "text-red-500" : "text-muted-foreground"}`}>
                                  {Math.round(device.batteryLevel * 100)}%
                                </span>
                              </div>
                            )}
                            {device.ipAddress && (
                              <span className="text-xs text-muted-foreground font-mono">{device.ipAddress}</span>
                            )}
                            {device.departmentName && (
                              <span className="text-xs text-muted-foreground">{device.departmentName}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <Badge variant={status.color ? "default" : "secondary"} className={`text-xs border-0 ${status.color}`}>
                        {status.label}
                      </Badge>
                      {device.suspended && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                          Suspended
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {!online && (
                            <DropdownMenuItem
                              disabled={regeneratingId === device.id}
                              className="text-blue-600 focus:text-blue-600 focus:bg-blue-50 dark:text-blue-400 dark:focus:bg-blue-950"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRegenerateCode(device);
                              }}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              New Code
                            </DropdownMenuItem>
                          )}
                          {online && (
                            <DropdownMenuItem
                              className="text-orange-600 focus:text-orange-600 focus:bg-orange-50 dark:text-orange-400 dark:focus:bg-orange-950"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLogoutClick(device);
                              }}
                            >
                              <LogOut className="mr-2 h-4 w-4" />
                              Logout Device
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className={device.suspended
                              ? "text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:text-emerald-400 dark:focus:bg-emerald-950"
                              : "text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:text-amber-400 dark:focus:bg-amber-950"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSuspendToggle(device);
                            }}
                          >
                            {device.suspended ? (
                              <><ShieldCheck className="mr-2 h-4 w-4" />Restore Data Access</>
                            ) : (
                              <><ShieldOff className="mr-2 h-4 w-4" />Suspend Data Access</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(device);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Device
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {index < devices.length - 1 && <Separator />}
                </React.Fragment>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Add Device / Code Dialog (unified) */}
      <Dialog open={showDeviceDialog} onOpenChange={handleCloseDeviceDialog}>
        <DialogContent className="sm:max-w-md">
          {dialogStep === "name" ? (
            <>
              <DialogHeader>
                <DialogTitle>Add Device</DialogTitle>
                <DialogDescription>
                  Give your device a name. You&apos;ll get a 6-digit code to enter on the device.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label htmlFor="device-name" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Device Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="device-name"
                    placeholder="e.g. Front Counter iPad"
                    value={newDeviceName}
                    onChange={(e) => { setNewDeviceName(e.target.value); setAddError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddDevice()}
                    disabled={isAdding}
                    autoFocus
                  />
                </div>
                {addError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{addError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDeviceDialog} disabled={isAdding} className="rounded-lg">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDevice}
                  disabled={isAdding || !newDeviceName.trim()}
                  className="rounded-lg bg-primary hover:bg-primary/90 text-white"
                >
                  {isAdding ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</>
                  ) : (
                    <><Key className="mr-2 h-4 w-4" />Add &amp; Generate Code</>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Device Authentication Code</DialogTitle>
                <DialogDescription>
                  Enter this code on <span className="font-medium">{codeDeviceName}</span> to connect it. Valid for {validityMinutes} minutes.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4 py-4">
                <div className="relative w-full">
                  <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 p-8">
                    <span className="text-4xl font-bold tracking-[0.3em] font-mono">
                      {deviceCode}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {timeRemaining > 0 ? (
                    <>
                      <span className="text-muted-foreground">Expires in:</span>
                      <span className={`font-semibold ${timeRemaining < 60 ? "text-destructive" : "text-foreground"}`}>
                        {formatTime(timeRemaining)}
                      </span>
                    </>
                  ) : (
                    <span className="text-destructive font-semibold">Code expired</span>
                  )}
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={handleCopyCode}
                    className="flex-1"
                    variant="outline"
                    disabled={timeRemaining === 0}
                  >
                    {copied ? (
                      <><Check className="mr-2 h-4 w-4" />Copied!</>
                    ) : (
                      <><Copy className="mr-2 h-4 w-4" />Copy Code</>
                    )}
                  </Button>
                  <Button onClick={handleCloseDeviceDialog} variant="secondary" className="flex-1">
                    Done
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Device Detail Dialog */}
      <Dialog open={!!selectedDevice} onOpenChange={(open) => !open && setSelectedDevice(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDevice?.customName || selectedDevice?.name || "Device Details"}</DialogTitle>
            <DialogDescription>
              {[selectedDevice?.brand || selectedDevice?.manufacturer, selectedDevice?.model].filter(Boolean).join(" ") || "Device details"}
            </DialogDescription>
          </DialogHeader>

          {selectedDevice && (
            <div className="space-y-4 py-2">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-1.5">
                  {isDeviceOnline(selectedDevice) ? (
                    <>
                      <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">
                        {isDevicePending(selectedDevice) ? "Pending" : "Offline"}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Separator />

              {/* Device Info — only show if device has registered */}
              {selectedDevice.serialNumber && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedDevice.deviceType && (
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">Type</span>
                        <span className="font-medium truncate block">{selectedDevice.deviceType}</span>
                      </div>
                    )}
                    {selectedDevice.operatingSystem && (
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">OS</span>
                        <span className="font-medium truncate block">
                          {selectedDevice.operatingSystem} {selectedDevice.operatingSystemVersion}
                        </span>
                      </div>
                    )}
                    {selectedDevice.appVersion && (
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">App Version</span>
                        <span className="font-medium truncate block">v{selectedDevice.appVersion} ({selectedDevice.buildNumber})</span>
                      </div>
                    )}
                    {selectedDevice.serialNumber && (
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">Serial Number</span>
                        <span className="font-medium text-xs font-mono truncate block">{selectedDevice.serialNumber}</span>
                      </div>
                    )}
                    {selectedDevice.displayResolution && (
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">Display</span>
                        <span className="font-medium text-xs truncate block">{selectedDevice.displayResolution}</span>
                      </div>
                    )}
                    {selectedDevice.ipAddress && (
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">IP Address</span>
                        <span className="font-medium font-mono text-xs truncate block">{selectedDevice.ipAddress}</span>
                      </div>
                    )}
                  </div>
                  <Separator />

                  {/* Battery */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      {selectedDevice.isCharging ? (
                        <BatteryCharging className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Battery className={`h-4 w-4 ${selectedDevice.batteryLevel < 0.2 ? "text-red-500" : "text-gray-500"}`} />
                      )}
                      <span className="text-muted-foreground">Battery</span>
                    </div>
                    <span className="font-medium">
                      {Math.round(selectedDevice.batteryLevel * 100)}%
                      {selectedDevice.isCharging && " (Charging)"}
                    </span>
                  </div>

                  {selectedDevice.timezone && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-muted-foreground">Timezone</span>
                      </div>
                      <span className="font-medium">{selectedDevice.timezone}</span>
                    </div>
                  )}
                </>
              )}

              {selectedDevice.departmentName && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium">{selectedDevice.departmentName}</span>
                  </div>
                </>
              )}

              {/* Actions */}
              <Separator />
              <div className="flex flex-col gap-2">
                {!isDeviceOnline(selectedDevice) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
                    disabled={regeneratingId === selectedDevice.id}
                    onClick={() => {
                      setSelectedDevice(null);
                      handleRegenerateCode(selectedDevice);
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    New Code
                  </Button>
                )}
                {isDeviceOnline(selectedDevice) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg border-orange-200 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
                    onClick={() => {
                      setSelectedDevice(null);
                      handleLogoutClick(selectedDevice);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout Device
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-full rounded-lg ${
                    selectedDevice.suspended
                      ? "border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                      : "border-amber-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950"
                  }`}
                  onClick={() => {
                    const dev = selectedDevice;
                    setSelectedDevice(null);
                    handleSuspendToggle(dev);
                  }}
                >
                  {selectedDevice.suspended ? (
                    <><ShieldCheck className="mr-2 h-4 w-4" />Restore Data Access</>
                  ) : (
                    <><ShieldOff className="mr-2 h-4 w-4" />Suspend Data Access</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-lg border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  onClick={() => {
                    setSelectedDevice(null);
                    handleDeleteClick(selectedDevice);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Device
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation */}
      {showLogoutAlert && deviceToLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg mx-4">
            <Card className="rounded-xl border shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Logout Device</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Are you sure you want to logout{" "}
                      <span className="font-semibold">{deviceToLogout.customName || deviceToLogout.name || deviceToLogout.id}</span>?
                      This will immediately invalidate the device&apos;s session and stop push notifications. You can regenerate a code to reconnect it later.
                    </p>
                  </div>
                </div>
                {logoutError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{logoutError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowLogoutAlert(false); setDeviceToLogout(null); setLogoutError(null); }}
                    disabled={isLoggingOut}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={confirmLogout}
                    disabled={isLoggingOut}
                    className="rounded-lg"
                  >
                    {isLoggingOut ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Logging out...</>
                    ) : (
                      "Logout Device"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteAlert && deviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg mx-4">
            <Card className="rounded-xl border shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 flex-shrink-0">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Delete Device</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Are you sure you want to permanently delete{" "}
                      <span className="font-semibold">{deviceToDelete.customName || deviceToDelete.name || deviceToDelete.id}</span>?
                      This cannot be undone. To use this device again, you&apos;ll need to add it as a new device.
                    </p>
                  </div>
                </div>
                {deleteError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowDeleteAlert(false); setDeviceToDelete(null); setDeleteError(null); }}
                    disabled={isDeleting}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="rounded-lg"
                  >
                    {isDeleting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>
                    ) : (
                      "Delete Device"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceSettings;
