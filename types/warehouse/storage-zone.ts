export type ZoneType =
  | "GENERAL"
  | "COLD_STORAGE"
  | "DRY_STORAGE"
  | "HAZARDOUS"
  | "QUARANTINE"
  | "STAGING";

export interface StorageZone {
  id: string;
  locationId: string;
  name: string;
  code: string;
  zoneType: ZoneType | null;
  description: string | null;
  temperatureControlled: boolean | null;
  active: boolean | null;
  sortOrder: number | null;
  binCount: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
