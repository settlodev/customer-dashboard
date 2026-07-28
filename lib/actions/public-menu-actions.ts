"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  MenuResolveResponse,
  MenuCatalogResponse,
  MenuOrderRequest,
  MenuOrderResponse,
} from "@/types/online-menu/type";

const API_KEY =
  "sk_menu_7f5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a";

function createMenuClient(): ApiClient {
  const client = new ApiClient();
  client.isPlain = true;
  return client;
}

export const resolveMenuSlug = async (
  slug: string,
): Promise<MenuResolveResponse> => {
  const apiClient = createMenuClient();
  const data = await apiClient.get<MenuResolveResponse>(
    `/api/menu/resolve/${slug}`,
    { headers: { "SETTLO-API-KEY": API_KEY } },
  );
  return parseStringify(data);
};

export const getMenuCatalog = async (
  locationId: string,
): Promise<MenuCatalogResponse> => {
  const apiClient = createMenuClient();
  const data = await apiClient.get<MenuCatalogResponse>(
    `/api/menu/${locationId}/catalog`,
    { headers: { "SETTLO-API-KEY": API_KEY } },
  );
  return parseStringify(data);
};

export const placeMenuOrder = async (
  locationId: string,
  order: MenuOrderRequest,
): Promise<MenuOrderResponse> => {
  const apiClient = createMenuClient();
  const data = await apiClient.post<MenuOrderResponse, MenuOrderRequest>(
    `/api/menu/${locationId}/orders`,
    order,
    { headers: { "SETTLO-API-KEY": API_KEY } },
  );
  return parseStringify(data);
};

export const getMenuOrderStatus = async (
  locationId: string,
  orderId: string,
): Promise<MenuOrderResponse> => {
  const apiClient = createMenuClient();
  const data = await apiClient.get<MenuOrderResponse>(
    `/api/menu/${locationId}/orders/${orderId}`,
    { headers: { "SETTLO-API-KEY": API_KEY } },
  );
  return parseStringify(data);
};
