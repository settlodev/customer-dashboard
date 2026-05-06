"use server";

import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";
import { ApiResponse, FormResponse } from "@/types/types";
type UUID = string;
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  Space,
  SpaceDTO,
  FloorPlan,
  TableCombination,
} from "@/types/space/type";
import {
  SpaceSchema,
  FloorPlanSchema,
  TableCombinationSchema,
} from "@/types/space/schema";

// ─── Helpers ────────────────────────────────────────────────────────

function buildSpacePayload(
  d: z.infer<typeof SpaceSchema>,
  expectedVersion?: number,
): SpaceDTO {
  return {
    name: d.name,
    code: d.code ?? "",
    capacity: d.capacity,
    minCapacity: d.minCapacity ?? null,
    type: d.type,
    tableStatus: d.tableStatus ?? null,
    active: d.active,
    reservable: d.reservable,
    turnTimeMinutes: d.turnTimeMinutes ?? null,
    posX: d.posX ?? null,
    posY: d.posY ?? null,
    color: d.color ?? "",
    needsCleaning: d.needsCleaning,
    description: d.description ?? null,
    sortOrder: d.sortOrder ?? null,
    parentSpaceId: d.parentSpaceId ?? null,
    floorPlanId: d.floorPlanId ?? null,
    ...(expectedVersion !== undefined ? { expectedVersion } : {}),
  };
}

function buildSearchParams(args: {
  q?: string;
  page: number;
  pageLimit: number;
  parentSpaceId?: string;
  topLevel?: boolean;
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(args.page ? args.page - 1 : 0));
  params.set("size", String(args.pageLimit || 10));
  params.set("sortBy", "name");
  params.set("sortDirection", "ASC");
  if (args.q) params.set("name", args.q);
  if (args.topLevel) {
    params.set("topLevel", "true");
  } else if (args.parentSpaceId) {
    params.set("parentSpaceId", args.parentSpaceId);
  }
  return params;
}

const FETCH_ALL_SIZE = 1000;

// ─── Tables ─────────────────────────────────────────────────────────
// /api/v1/tables — bookable items only (TABLE, SEAT).

export const fetchAllTables = async (): Promise<Space[]> => {
  const apiClient = new ApiClient("orders");
  const data = await apiClient.get(
    `/api/v1/tables?size=${FETCH_ALL_SIZE}&sortBy=name&sortDirection=ASC`,
  );
  const page = parseStringify(data) as ApiResponse<Space>;
  return page.content;
};

export const searchTables = async (
  q: string,
  page: number,
  pageLimit: number,
  parentSpaceId?: string,
): Promise<ApiResponse<Space>> => {
  const apiClient = new ApiClient("orders");
  const params = buildSearchParams({ q, page, pageLimit, parentSpaceId });
  const data = await apiClient.get(`/api/v1/tables?${params.toString()}`);
  return parseStringify(data);
};

export const getTable = async (id: UUID): Promise<Space> => {
  const apiClient = new ApiClient("orders");
  const data = await apiClient.get(`/api/v1/tables/${id}`);
  return parseStringify(data);
};

export const createTable = async (
  table: z.infer<typeof SpaceSchema>,
): Promise<FormResponse | void> => {
  const valid = SpaceSchema.safeParse(table);
  if (!valid.success) {
    return SettloErrorHandler.createErrorResponse(
      valid.error,
      "Please fill all the required fields",
    );
  }

  try {
    const apiClient = new ApiClient("orders");
    await apiClient.post("/api/v1/tables", buildSpacePayload(valid.data));
  } catch (error: unknown) {
    revalidatePath("/tables");
    return SettloErrorHandler.createErrorResponse(error, "Failed to create table");
  }
  revalidatePath("/tables");
  return SettloErrorHandler.createSuccessResponse("Table created successfully");
};

export const updateTable = async (
  id: UUID,
  table: z.infer<typeof SpaceSchema>,
  expectedVersion: number,
): Promise<FormResponse | void> => {
  const valid = SpaceSchema.safeParse(table);
  if (!valid.success) {
    return SettloErrorHandler.createErrorResponse(
      valid.error,
      "Please fill all the required fields",
    );
  }

  try {
    const apiClient = new ApiClient("orders");
    await apiClient.put(
      `/api/v1/tables/${id}`,
      buildSpacePayload(valid.data, expectedVersion),
    );
  } catch (error: unknown) {
    revalidatePath("/tables");
    return SettloErrorHandler.createErrorResponse(error, "Failed to update table");
  }
  revalidatePath("/tables");
  return SettloErrorHandler.createSuccessResponse("Table updated successfully");
};

export const deleteTable = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Table ID is required to perform this request");
  const apiClient = new ApiClient("orders");
  await apiClient.delete(`/api/v1/tables/${id}`);
  revalidatePath("/tables");
};

// ─── Spaces ─────────────────────────────────────────────────────────
// /api/v1/spaces — area types only (HALL, SECTION, TERRACE, BAR, COUNTER, ROOM).

export const fetchAllSpaces = async (): Promise<Space[]> => {
  const apiClient = new ApiClient("orders");
  const data = await apiClient.get(
    `/api/v1/spaces?size=${FETCH_ALL_SIZE}&sortBy=name&sortDirection=ASC`,
  );
  const page = parseStringify(data) as ApiResponse<Space>;
  return page.content;
};

export const searchSpaces = async (
  q: string,
  page: number,
  pageLimit: number,
  parentSpaceId?: string,
  topLevel?: boolean,
): Promise<ApiResponse<Space>> => {
  const apiClient = new ApiClient("orders");
  const params = buildSearchParams({ q, page, pageLimit, parentSpaceId, topLevel });
  const data = await apiClient.get(`/api/v1/spaces?${params.toString()}`);
  return parseStringify(data);
};

export const getSpace = async (id: UUID): Promise<Space> => {
  const apiClient = new ApiClient("orders");
  const data = await apiClient.get(`/api/v1/spaces/${id}`);
  return parseStringify(data);
};

export const createSpace = async (
  space: z.infer<typeof SpaceSchema>,
): Promise<FormResponse | void> => {
  const valid = SpaceSchema.safeParse(space);
  if (!valid.success) {
    return SettloErrorHandler.createErrorResponse(
      valid.error,
      "Please fill all the required fields",
    );
  }

  try {
    const apiClient = new ApiClient("orders");
    await apiClient.post("/api/v1/spaces", buildSpacePayload(valid.data));
  } catch (error: unknown) {
    revalidatePath("/spaces");
    return SettloErrorHandler.createErrorResponse(error, "Failed to create space");
  }
  revalidatePath("/spaces");
  return SettloErrorHandler.createSuccessResponse("Space created successfully");
};

export const updateSpace = async (
  id: UUID,
  space: z.infer<typeof SpaceSchema>,
  expectedVersion: number,
): Promise<FormResponse | void> => {
  const valid = SpaceSchema.safeParse(space);
  if (!valid.success) {
    return SettloErrorHandler.createErrorResponse(
      valid.error,
      "Please fill all the required fields",
    );
  }

  try {
    const apiClient = new ApiClient("orders");
    await apiClient.put(
      `/api/v1/spaces/${id}`,
      buildSpacePayload(valid.data, expectedVersion),
    );
  } catch (error: unknown) {
    revalidatePath("/spaces");
    return SettloErrorHandler.createErrorResponse(error, "Failed to update space");
  }
  revalidatePath("/spaces");
  return SettloErrorHandler.createSuccessResponse("Space updated successfully");
};

export const deleteSpace = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Space ID is required to perform this request");
  const apiClient = new ApiClient("orders");
  await apiClient.delete(`/api/v1/spaces/${id}`);
  revalidatePath("/spaces");
};

// ─── Floor Plans ─────────────────────────────────────────────────────

export const fetchAllFloorPlans = async (): Promise<FloorPlan[]> => {
  const apiClient = new ApiClient("orders");
  const data = await apiClient.get(
    `/api/v1/floor-plans?size=${FETCH_ALL_SIZE}&sortBy=name&sortDirection=ASC`,
  );
  const page = parseStringify(data) as ApiResponse<FloorPlan>;
  return page.content;
};

export const searchFloorPlans = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<FloorPlan>> => {
  const apiClient = new ApiClient("orders");
  const params = buildSearchParams({ q, page, pageLimit });
  const data = await apiClient.get(`/api/v1/floor-plans?${params.toString()}`);
  return parseStringify(data);
};

export const getFloorPlan = async (id: UUID): Promise<FloorPlan> => {
  const apiClient = new ApiClient("orders");
  const data = await apiClient.get(`/api/v1/floor-plans/${id}`);
  return parseStringify(data);
};

export const createFloorPlan = async (
  floorPlan: z.infer<typeof FloorPlanSchema>,
): Promise<FormResponse | void> => {
  const validated = FloorPlanSchema.safeParse(floorPlan);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  try {
    const apiClient = new ApiClient("orders");
    await apiClient.post("/api/v1/floor-plans", validated.data);
  } catch (error: unknown) {
    revalidatePath("/floor-plans");
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create floor plan",
    );
  }
  revalidatePath("/floor-plans");
  revalidatePath("/tables");
  revalidatePath("/spaces");
  return SettloErrorHandler.createSuccessResponse(
    "Floor plan created successfully",
  );
};

export const updateFloorPlan = async (
  id: UUID,
  floorPlan: z.infer<typeof FloorPlanSchema>,
  expectedVersion: number,
): Promise<FormResponse | void> => {
  const validated = FloorPlanSchema.safeParse(floorPlan);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  try {
    const apiClient = new ApiClient("orders");
    await apiClient.put(`/api/v1/floor-plans/${id}`, {
      ...validated.data,
      expectedVersion,
    });
  } catch (error: unknown) {
    revalidatePath("/floor-plans");
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update floor plan",
    );
  }
  revalidatePath("/floor-plans");
  revalidatePath("/tables");
  revalidatePath("/spaces");
  return SettloErrorHandler.createSuccessResponse(
    "Floor plan updated successfully",
  );
};

export const deleteFloorPlan = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Floor plan ID is required");
  const apiClient = new ApiClient("orders");
  await apiClient.delete(`/api/v1/floor-plans/${id}`);
  revalidatePath("/floor-plans");
  revalidatePath("/tables");
  revalidatePath("/spaces");
};

// ─── Table Combinations ──────────────────────────────────────────────

export const fetchAllTableCombinations = async (): Promise<TableCombination[]> => {
  const apiClient = new ApiClient("orders");
  const data = await apiClient.get(
    `/api/v1/table-combinations?size=${FETCH_ALL_SIZE}&sortBy=name&sortDirection=ASC`,
  );
  const page = parseStringify(data) as ApiResponse<TableCombination>;
  return page.content;
};

export const searchTableCombinations = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<TableCombination>> => {
  const apiClient = new ApiClient("orders");
  const params = buildSearchParams({ q, page, pageLimit });
  const data = await apiClient.get(
    `/api/v1/table-combinations?${params.toString()}`,
  );
  return parseStringify(data);
};

export const createTableCombination = async (
  combination: z.infer<typeof TableCombinationSchema>,
): Promise<FormResponse | void> => {
  const validated = TableCombinationSchema.safeParse(combination);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  try {
    const apiClient = new ApiClient("orders");
    await apiClient.post("/api/v1/table-combinations", validated.data);
  } catch (error: unknown) {
    revalidatePath("/table-combinations");
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create table combination",
    );
  }
  revalidatePath("/table-combinations");
  return SettloErrorHandler.createSuccessResponse(
    "Table combination created successfully",
  );
};

export const updateTableCombination = async (
  id: UUID,
  combination: z.infer<typeof TableCombinationSchema>,
  expectedVersion: number,
): Promise<FormResponse | void> => {
  const validated = TableCombinationSchema.safeParse(combination);
  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  try {
    const apiClient = new ApiClient("orders");
    await apiClient.put(`/api/v1/table-combinations/${id}`, {
      ...validated.data,
      expectedVersion,
    });
  } catch (error: unknown) {
    revalidatePath("/table-combinations");
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update table combination",
    );
  }
  revalidatePath("/table-combinations");
  return SettloErrorHandler.createSuccessResponse(
    "Table combination updated successfully",
  );
};

export const deleteTableCombination = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Table combination ID is required");
  const apiClient = new ApiClient("orders");
  await apiClient.delete(`/api/v1/table-combinations/${id}`);
  revalidatePath("/table-combinations");
};

/**
 * Populate `tables: Space[]` on each combination by zipping `tableIds`
 * against a tables list. Combinations with a missing/deleted member get
 * a partial `tables` array (the deleted member is silently dropped).
 */
export const hydrateCombinations = async (
  combos: TableCombination[],
  tables: Space[],
): Promise<TableCombination[]> => {
  const byId = new Map(tables.map((t) => [String(t.id), t]));
  return combos.map((c) => ({
    ...c,
    tables: (c.tableIds ?? [])
      .map((id) => byId.get(String(id)))
      .filter((t): t is Space => t !== undefined),
  }));
};
