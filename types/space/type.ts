import { UUID } from "crypto";
import { TableSpaceType, TableStatus } from "@/types/enums";

export declare interface Space {
  id: UUID;
  name: string;
  code: string | null;
  capacity: number;
  minCapacity: number | null;
  type: TableSpaceType;
  tableStatus: TableStatus | null;
  active: boolean;
  reservable: boolean;
  turnTimeMinutes: number | null;
  posX: number | null;
  posY: number | null;
  color: string | null;
  needsCleaning: boolean;
  description: string | null;
  sortOrder: number | null;
  parentSpaceId: UUID | null;
  parentSpaceName: string | null;
  floorPlanId: UUID | null;
  floorPlanName: string | null;
  location: UUID;
  business: string;
  status: boolean;
  canDelete: boolean;
  isArchived: boolean;
}

export declare interface FloorPlan {
  id: UUID;
  name: string;
  description: string | null;
  width: number | null;
  height: number | null;
  isDefault: boolean;
  location: UUID;
  status: boolean;
  canDelete: boolean;
  isArchived: boolean;
}

export declare interface TableCombination {
  id: UUID;
  name: string;
  capacity: number;
  tables: Space[];
  location: UUID;
  status: boolean;
  canDelete: boolean;
  isArchived: boolean;
}

export declare interface SpaceDTO {
  name: string;
  code: string;
  capacity: number;
  minCapacity: number | null;
  type: string;
  tableStatus: string | null;
  active: boolean;
  reservable: boolean;
  turnTimeMinutes: number | null;
  posX: number | null;
  posY: number | null;
  color: string;
  needsCleaning: boolean;
  description: string | null;
  sortOrder: number | null;
  parentSpaceId: string | null;
  floorPlanId: string | null;
  status: boolean;
  canDelete: boolean;
  isArchived: boolean;
  location: UUID;
}

export const SPACE_TYPES: TableSpaceType[] = [
  TableSpaceType.HALL,
  TableSpaceType.SECTION,
  TableSpaceType.TERRACE,
  TableSpaceType.BAR,
  TableSpaceType.COUNTER,
  TableSpaceType.ROOM,
];

export const BOOKABLE_TYPES: TableSpaceType[] = [
  TableSpaceType.TABLE,
  TableSpaceType.SEAT,
];

export const TABLE_SPACE_TYPE_LABELS: Record<TableSpaceType, string> = {
  [TableSpaceType.TABLE]: "Table",
  [TableSpaceType.SEAT]: "Seat",
  [TableSpaceType.ROOM]: "Room",
  [TableSpaceType.SECTION]: "Section",
  [TableSpaceType.TERRACE]: "Terrace",
  [TableSpaceType.BAR]: "Bar",
  [TableSpaceType.COUNTER]: "Counter",
  [TableSpaceType.HALL]: "Hall",
};

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  [TableStatus.AVAILABLE]: "Available",
  [TableStatus.RESERVED]: "Reserved",
  [TableStatus.SEATED]: "Seated",
  [TableStatus.OCCUPIED]: "Occupied",
  [TableStatus.DIRTY]: "Dirty",
  [TableStatus.OUT_OF_SERVICE]: "Out of Service",
};
