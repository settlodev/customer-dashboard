import type { DestinationType } from "@/types/catalogue/enums";

export interface ProductCollection {
  id: string;
  locationType: DestinationType;
  locationId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  archivedAt: string | null;
  productCount: number;
  products: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  productActive: boolean;
  sortOrder: number;
}
