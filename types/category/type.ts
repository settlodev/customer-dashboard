import type { DestinationType } from "@/types/catalogue/enums";

export interface Category {
  id: string;
  locationType: DestinationType;
  locationId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  archivedAt: string | null;
  sortOrder: number;
  parentId: string | null;
  parentName: string | null;
  // Departments are a paid-tier feature attached at the category level. The
  // server returns the UUID always and the resolved name when known.
  departmentId: string | null;
  departmentName: string | null;
  children: Category[];
  createdAt: string;
  updatedAt: string;
}
