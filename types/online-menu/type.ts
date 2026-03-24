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

// ─── Public Menu API Types ──────────────────────────────────────────────────

export interface MenuBusiness {
  businessName: string;
  locationName: string;
  slug: string;
  businessType: string;
  logo: string | null;
  locationLogo: string | null;
  bannerImage: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  faviconUrl: string | null;
  fontFamily: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  street: string | null;
  city: string | null;
  region: string | null;
  openingTime: string | null;
  closingTime: string | null;
  socials: {
    instagram: string | null;
    facebook: string | null;
    twitter: string | null;
    website: string | null;
    tiktok: string | null;
    linkedin: string | null;
    youtube: string | null;
  };
}

export interface MenuPublicSettings {
  menuVisible: boolean;
  orderingStatus: MenuOrderingStatus;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  dineInEnabled: boolean;
  customerAccountsEnabled: boolean;
  allowGuestCheckout: boolean;
  allowEmailLogin: boolean;
  allowPhoneOtpLogin: boolean;
  minimumOrderAmount: number | null;
  maximumOrderAmount: number | null;
  maxItemsPerOrder: number | null;
  deliveryFee: number | null;
  deliveryRadiusKm: number | null;
  defaultPrepTimeMinutes: number | null;
  maxPrepTimeMinutes: number | null;
  allowOnlinePayment: boolean;
  allowCashOnPickup: boolean;
  allowCashOnDelivery: boolean;
  pausedMessage: string | null;
  closedMessage: string | null;
}

export interface MenuResolveResponse {
  menuId: string;
  locationId: string;
  menuName: string;
  slug: string;
  description: string | null;
  image: string | null;
  qrCode: string | null;
  business: MenuBusiness;
  settings: MenuPublicSettings;
}

export interface MenuAddon {
  id: string;
  title: string;
  price: number;
}

export interface MenuModifierItem {
  id: string;
  name: string;
  price: number;
}

export interface MenuModifier {
  id: string;
  name: string;
  isMandatory: boolean;
  maximumSelection: number;
  items: MenuModifierItem[];
}

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image: string | null;
  addons: MenuAddon[];
  modifiers: MenuModifier[];
}

export interface MenuProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  categoryId: string;
  categoryName: string;
  startingPrice: number;
  variantCount: number;
  variants: MenuVariant[];
}

export interface MenuCategory {
  id: string;
  name: string;
  image: string | null;
  productCount: number;
  products: MenuProduct[];
}

export interface MenuCatalogResponse {
  business: MenuBusiness;
  orderingStatus: MenuOrderingStatus;
  menuVisible: boolean;
  totalProducts: number;
  categories: MenuCategory[];
}

export type ServingType = "TAKEAWAY" | "DELIVERY" | "DINE_IN";

export interface MenuOrderItem {
  variant: string;
  quantity: number;
  comment?: string;
  modifiers?: Array<{ modifier: string; quantity: number }>;
  addons?: Array<{ addon: string; quantity: number }>;
}

export interface MenuOrderRequest {
  servingType: ServingType;
  customerPhoneNumber: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  comment?: string;
  deliveryAddress?: string;
  tableAndSpace?: string;
  items: MenuOrderItem[];
}

export interface MenuOrderResponseItem {
  id: string;
  name: string;
  image: string | null;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface MenuOrderResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  servingType: ServingType;
  customerFirstName: string;
  customerLastName: string;
  customerPhoneNumber: string;
  customerEmail: string | null;
  grossAmount: number;
  netAmount: number;
  paymentStatus: string;
  estimatedPrepTimeMinutes: number | null;
  items: MenuOrderResponseItem[];
  createdAt: string;
}
