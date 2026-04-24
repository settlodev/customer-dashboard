// Mirrors DeviceResponse from the Settlo Accounts Service
// (`/api/v1/devices/{id}`). Pairing lives in the Auth Service: devices arrive
// in the accounts service via Kafka events and cannot be originated from here.
// All non-hardware fields are managed server-side (status transitions via
// lifecycle endpoints, hardware + runtime telemetry via heartbeat / Kafka).

export type DeviceStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED"
  | "RETIRED"
  | "REVOKED"
  | "PENDING_PAIRING";

export type AssignmentType = "LOCATION" | "STORE" | "WAREHOUSE";

export interface Device {
  id: string;
  accountId: string;
  businessId: string;
  authDeviceId: string | null;
  fingerprint: string | null;

  // Identity
  name: string | null;
  customName: string | null;

  // Assignment
  assignedToId: string | null;
  assignmentType: AssignmentType | null;
  departmentId: string | null;

  // Lifecycle
  status: DeviceStatus | null;
  suspended: boolean;
  pinRequired: boolean;

  // Hardware (static)
  deviceType: string | null;
  os: string | null;
  osVersion: string | null;
  appVersion: string | null;
  model: string | null;
  manufacturer: string | null;
  brand: string | null;
  serialNumber: string | null;
  isTablet: boolean | null;

  // Runtime telemetry (heartbeat)
  batteryLevel: number | null;
  isCharging: boolean | null;
  availableStorage: number | null;
  lastActiveAt: string | null;
  lastIp: string | null;

  // Timestamps
  pairedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DeviceSettings {
  id: string;
  accountId: string;
  deviceId: string;
  locationId: string;
  orderingMode: "STANDARD" | "TABLE_MANAGEMENT" | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedDeviceSettings {
  deviceId: string;
  locationId: string;
  orderingMode: "STANDARD" | "TABLE_MANAGEMENT" | null;
  orderingModeSource: "device" | "location";
}

export interface DeviceCounts {
  total: number;
  active: number;
}

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
  RETIRED: "Retired",
  REVOKED: "Revoked",
  PENDING_PAIRING: "Pending pairing",
};
