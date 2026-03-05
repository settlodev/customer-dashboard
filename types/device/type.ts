import { UUID } from "crypto";

export declare interface Device {
  id: UUID;
  customName: string;
  name: string;
  departmentId: UUID;
  departmentName: string;
  deviceId: string;
  model: string;
  serialNumber: string;
  manufacturer: string;
  imei: string;
  macAddress: string;
  operatingSystem: string;
  operatingSystemVersion: string;
  displayResolution: string;
  storageInGB: number;
  ramInGB: number;
  processor: string;
  batteryLevel: number;
  firebaseToken: string;
  canDelete: boolean;
  status: boolean;
  isArchived: boolean;
  location: UUID;
}
