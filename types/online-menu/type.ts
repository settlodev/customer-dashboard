import { UUID } from "node:crypto";

export interface OnlineMenu {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  qrCode: string | null;
  location: UUID;
  locationName: string;
  status: boolean;
}

export type MenuOrderingStatus = "ACTIVE" | "PAUSED" | "CLOSED";

export interface MenuSettings {
  id: UUID;
  onlineMenu: UUID;
  menuVisible: boolean;
  orderingStatus: MenuOrderingStatus;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  dineInEnabled: boolean;
  qrOrderingEnabled: boolean;
  tableOrderingEnabled: boolean;
  allowCustomersToJoinTableOrders: boolean;
  qrIncludesTableCode: boolean;
  customerAccountsEnabled: boolean;
  allowGuestCheckout: boolean;
  allowEmailLogin: boolean;
  allowPhoneOtpLogin: boolean;
  saveCustomerDetails: boolean;
  allowReorder: boolean;
  autoCreateTableSession: boolean;
  allowMultipleOrdersPerTable: boolean;
  allowCustomersToViewCurrentTableOrder: boolean;
  payAtTableEnabled: boolean;
  splitBillEnabled: boolean;
  minimumOrderAmount: number | null;
  maximumOrderAmount: number | null;
  maxItemsPerOrder: number | null;
  deliveryFee: number | null;
  deliveryRadiusKm: number | null;
  defaultPrepTimeMinutes: number | null;
  maxPrepTimeMinutes: number | null;
  allowScheduledOrders: boolean;
  maxScheduleDaysAhead: number | null;
  maxOrdersPerTimeSlot: number | null;
  timeSlotMinutes: number | null;
  allowOnlinePayment: boolean;
  allowCashOnPickup: boolean;
  allowCashOnDelivery: boolean;
  logoUrl: string | null;
  bannerImageUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  faviconUrl: string | null;
  fontFamily: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  shareImageUrl: string | null;
  rateLimitPerMinute: number | null;
  maxOrdersPerCustomerPerHour: number | null;
  pausedMessage: string | null;
  closedMessage: string | null;

  // Derived from Location (read-only in response)
  publicBusinessName: string | null;
  publicDescription: string | null;
  locationPhone: string | null;
  locationEmail: string | null;
  locationAddress: string | null;
  locationCity: string | null;
  locationRegion: string | null;
  locationStreet: string | null;

  // Derived from Business (read-only in response)
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  tiktok: string | null;
  website: string | null;
}

export interface OnlineMenuDTO {
  name: string;
  description?: string;
  image?: string;
}
