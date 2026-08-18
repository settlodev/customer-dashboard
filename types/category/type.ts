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
  // Department is mandatory — the inventory service auto-resolves it when
  // the location has a single department and validates user input
  // otherwise. The resolved name may still be null if the cross-service
  // mirror has not caught up yet.
  departmentId: string;
  departmentName: string | null;
  // Number of products linked to this category. Populated by the list
  // endpoint; other endpoints may omit it, hence nullable.
  productCount: number | null;
  children: Category[];
  createdAt: string;
  updatedAt: string;
}
