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
  children: Category[];
  createdAt: string;
  updatedAt: string;
}
