"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Separator } from "../ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Device } from "@/types/device/type";
import {
  listAllDevices,
  logoutDevice,
  deleteDevice,
  addDevice,
  regenerateDeviceCode,
} from "@/lib/actions/devices-actions";

const DeviceSettings = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add device state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Code modal state (shared by add + regenerate)
  const [showCodeModal, setShowCodeModal] = useState(false);
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
      if (remaining === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const showCode = (name: string, data: { code: string; expiresAt: string; validityMinutes: number }) => {
    setCodeDeviceName(name);
    setDeviceCode(data.code);
    setExpiresAt(data.expiresAt);
    setValidityMinutes(data.validityMinutes);
    setShowCodeModal(true);
  };

  const handleAddDevice = async () => {
    const name = newDeviceName.trim();
    if (!name) return;

    setIsAdding(true);
    setAddError(null);

    try {
      const result = await addDevice(name);
      if (result.success && result.data) {
        setShowAddDialog(false);
        setNewDeviceName("");
        showCode(name, result.data);
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
        showCode(device.customName || device.name, result.data);
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

  const handleCloseCodeModal = () => {
    setShowCodeModal(false);
    setDeviceCode(null);
    setExpiresAt(null);
    setTimeRemaining(0);
    setCopied(false);
    setCodeDeviceName("");
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
          onClick={() => { setShowAddDialog(true); setAddError(null); setNewDeviceName(""); }}
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
              onClick={() => { setShowAddDialog(true); setAddError(null); setNewDeviceName(""); }}
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
                    className="flex items-center justify-between px-3 py-3.5 rounded-lg hover:bg-primary-light dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <Badge variant={status.color ? "default" : "secondary"} className={`text-xs border-0 ${status.color}`}>
                        {status.label}
                      </Badge>
                      {/* Regenerate code for offline/pending devices */}
                      {!online && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={regeneratingId === device.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegenerateCode(device);
                          }}
                          className="h-8"
                        >
                          {regeneratingId === device.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                              <span className="hidden sm:inline">New Code</span>
                            </>
                          )}
                        </Button>
                      )}
                      {/* Logout for online devices */}
                      {online && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLogoutClick(device);
                          }}
                          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="mr-1.5 h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Logout</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  {index < devices.length - 1 && <Separator />}
                </React.Fragment>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Add Device Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
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
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isAdding} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleAddDevice}
              disabled={isAdding || !newDeviceName.trim()}
              className="rounded-lg bg-primary hover:bg-primary/90 text-white"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Add &amp; Generate Code
                </>
              )}
            </Button>
          </DialogFooter>
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
                      <div>
                        <span className="text-muted-foreground block text-xs">Type</span>
                        <span className="font-medium">{selectedDevice.deviceType}</span>
                      </div>
                    )}
                    {selectedDevice.operatingSystem && (
                      <div>
                        <span className="text-muted-foreground block text-xs">OS</span>
                        <span className="font-medium">
                          {selectedDevice.operatingSystem} {selectedDevice.operatingSystemVersion}
                        </span>
                      </div>
                    )}
                    {selectedDevice.appVersion && (
                      <div>
                        <span className="text-muted-foreground block text-xs">App Version</span>
                        <span className="font-medium">v{selectedDevice.appVersion} ({selectedDevice.buildNumber})</span>
                      </div>
                    )}
                    {selectedDevice.serialNumber && (
                      <div>
                        <span className="text-muted-foreground block text-xs">Serial Number</span>
                        <span className="font-medium text-xs font-mono">{selectedDevice.serialNumber}</span>
                      </div>
                    )}
                    {selectedDevice.displayResolution && (
                      <div>
                        <span className="text-muted-foreground block text-xs">Display</span>
                        <span className="font-medium">{selectedDevice.displayResolution}</span>
                      </div>
                    )}
                    {selectedDevice.ipAddress && (
                      <div>
                        <span className="text-muted-foreground block text-xs">IP Address</span>
                        <span className="font-medium font-mono text-xs">{selectedDevice.ipAddress}</span>
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
              <div className="flex gap-2">
                {!isDeviceOnline(selectedDevice) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg"
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
                    className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                    onClick={() => {
                      setSelectedDevice(null);
                      handleLogoutClick(selectedDevice);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  onClick={() => {
                    setSelectedDevice(null);
                    handleDeleteClick(selectedDevice);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Code Modal (shared by add + regenerate) */}
      <Dialog open={showCodeModal} onOpenChange={handleCloseCodeModal}>
        <DialogContent className="sm:max-w-md">
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
              <Button onClick={handleCloseCodeModal} variant="secondary" className="flex-1">
                Close
              </Button>
            </div>
          </div>
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
