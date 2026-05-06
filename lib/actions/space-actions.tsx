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

// ─── Tables & Spaces ─────────────────────────────────────────────────

export const fetchAllSpaces = async (): Promise<Space[]> => {
  try {
    const apiClient = new ApiClient("orders");
    const data = await apiClient.get(
      "/api/v1/tables-and-spaces?size=200&sortBy=name&sortDirection=ASC",
    );
    const page = parseStringify(data) as ApiResponse<Space>;
    return page.content;
  } catch (error) {
    throw error;
  }
};

export const searchSpaces = async (
  q: string,
  page: number,
  pageLimit: number,
  types?: string[],
  parentSpaceId?: string,
  topLevel?: boolean,
): Promise<ApiResponse<Space>> => {
  try {
    const apiClient = new ApiClient("orders");
    const params = new URLSearchParams();
    params.set("page", String(page ? page - 1 : 0));
    params.set("size", String(pageLimit || 10));
    params.set("sortBy", "name");
    params.set("sortDirection", "ASC");
    if (q) params.set("name", q);
    if (types && types.length > 0) {
      types.forEach((t) => params.append("types", t));
    }
    if (topLevel) {
      params.set("topLevel", "true");
    } else if (parentSpaceId) {
      params.set("parentSpaceId", parentSpaceId);
    }

    const data = await apiClient.get(
      `/api/v1/tables-and-spaces?${params.toString()}`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getSpace = async (id: UUID): Promise<Space> => {
  const apiClient = new ApiClient("orders");
  const data = await apiClient.get(`/api/v1/tables-and-spaces/${id}`);
  return parseStringify(data);
};

export const createSpace = async (
  space: z.infer<typeof SpaceSchema>,
): Promise<FormResponse | void> => {
  const validSpaceData = SpaceSchema.safeParse(space);
  if (!validSpaceData.success) {
    return SettloErrorHandler.createErrorResponse(
      validSpaceData.error,
      "Please fill all the required fields",
    );
  }

  const payload = buildSpacePayload(validSpaceData.data);

  try {
    const apiClient = new ApiClient("orders");
    await apiClient.post("/api/v1/tables-and-spaces", payload);
  } catch (error: unknown) {
    revalidatePath("/spaces");
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create table/space",
    );
  }
  revalidatePath("/spaces");
  return SettloErrorHandler.createSuccessResponse(
    "Table/space created successfully",
  );
};

export const updateSpace = async (
  id: UUID,
  space: z.infer<typeof SpaceSchema>,
  expectedVersion: number,
): Promise<FormResponse | void> => {
  const validSpaceData = SpaceSchema.safeParse(space);
  if (!validSpaceData.success) {
    return SettloErrorHandler.createErrorResponse(
      validSpaceData.error,
      "Please fill all the required fields",
    );
  }

  const payload = buildSpacePayload(validSpaceData.data, expectedVersion);

  try {
    const apiClient = new ApiClient("orders");
    await apiClient.put(`/api/v1/tables-and-spaces/${id}`, payload);
  } catch (error: unknown) {
    revalidatePath("/spaces");
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update table/space",
    );
  }
  revalidatePath("/spaces");
  return SettloErrorHandler.createSuccessResponse(
    "Table/space updated successfully",
  );
};

export const deleteSpace = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Space ID is required to perform this request");
  try {
    const apiClient = new ApiClient("orders");
    await apiClient.delete(`/api/v1/tables-and-spaces/${id}`);
    revalidatePath("/spaces");
  } catch (error) {
    throw error;
  }
};

// ─── Floor Plans ─────────────────────────────────────────────────────

export const fetchFloorPlans = async (): Promise<FloorPlan[]> => {
  try {
    const apiClient = new ApiClient("orders");
    const data = await apiClient.get(
      "/api/v1/floor-plans?size=200&sortBy=name&sortDirection=ASC",
    );
    const page = parseStringify(data) as ApiResponse<FloorPlan>;
    return page.content;
  } catch (error) {
    throw error;
  }
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
    revalidatePath("/spaces");
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create floor plan",
    );
  }
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
    revalidatePath("/spaces");
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update floor plan",
    );
  }
  revalidatePath("/spaces");
  return SettloErrorHandler.createSuccessResponse(
    "Floor plan updated successfully",
  );
};

export const deleteFloorPlan = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Floor plan ID is required");
  try {
    const apiClient = new ApiClient("orders");
    await apiClient.delete(`/api/v1/floor-plans/${id}`);
    revalidatePath("/spaces");
  } catch (error) {
    throw error;
  }
};

// ─── Table Combinations ──────────────────────────────────────────────

/**
 * Returns combinations as the OMS sends them — `tableIds: UUID[]` only.
 * Use {@link hydrateCombinations} to populate `tables: Space[]` for UI
 * rendering using a spaces list you already have.
 */
export const fetchTableCombinations = async (): Promise<TableCombination[]> => {
  try {
    const apiClient = new ApiClient("orders");
    const data = await apiClient.get(
      "/api/v1/table-combinations?size=200&sortBy=name&sortDirection=ASC",
    );
    const page = parseStringify(data) as ApiResponse<TableCombination>;
    return page.content;
  } catch (error) {
    throw error;
  }
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
    revalidatePath("/spaces");
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to create table combination",
    );
  }
  revalidatePath("/spaces");
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
    revalidatePath("/spaces");
    return SettloErrorHandler.createErrorResponse(
      error,
      "Failed to update table combination",
    );
  }
  revalidatePath("/spaces");
  return SettloErrorHandler.createSuccessResponse(
    "Table combination updated successfully",
  );
};

export const deleteTableCombination = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Table combination ID is required");
  try {
    const apiClient = new ApiClient("orders");
    await apiClient.delete(`/api/v1/table-combinations/${id}`);
    revalidatePath("/spaces");
  } catch (error) {
    throw error;
  }
};

/**
 * Populate `tables: Space[]` on each combination by zipping `tableIds`
 * against a spaces list. Combinations with a missing/deleted table get
 * a partial `tables` array (the deleted member is silently dropped).
 */
export const hydrateCombinations = async (
  combos: TableCombination[],
  spaces: Space[],
): Promise<TableCombination[]> => {
  const byId = new Map(spaces.map((s) => [String(s.id), s]));
  return combos.map((c) => ({
    ...c,
    tables: (c.tableIds ?? [])
      .map((id) => byId.get(String(id)))
      .filter((s): s is Space => s !== undefined),
  }));
};
