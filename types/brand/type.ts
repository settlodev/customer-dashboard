import type { DestinationType } from "@/types/catalogue/enums";

export interface Brand {
  id: string;
  locationType: DestinationType;
  locationId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
