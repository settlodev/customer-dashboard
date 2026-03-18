"use server";

import { getAuthenticatedUser } from "../auth-utils";
import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";
import { SettloErrorHandler } from "@/lib/settlo-error-handler";
import { ApiResponse, FormResponse } from "@/types/types";
import { UUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentLocation } from "./business/get-current-business";
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
  locationId: UUID,
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
    status: d.status ?? true,
    canDelete: true,
    isArchived: false,
    location: locationId,
  };
}

// ─── Tables & Spaces ─────────────────────────────────────────────────

export const fetchAllSpaces = async (): Promise<Space[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const spaceData = await apiClient.get(
      `/api/tables-and-spaces/${location?.id}`,
    );
    return parseStringify(spaceData);
  } catch (error) {
    throw error;
  }
};

export const searchSpaces = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Space>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    const query = {
      filters: [
        {
          key: "name",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
        },
      ],
      sorts: [
        {
          key: "name",
          direction: "ASC",
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };

    const spaceData = await apiClient.post(
      `/api/tables-and-spaces/${location?.id}`,
      query,
    );

    return parseStringify(spaceData);
  } catch (error) {
    throw error;
  }
};

export const createSpace = async (
  space: z.infer<typeof SpaceSchema>,
): Promise<FormResponse | void> => {
  // let formResponse: FormResponse | null = null;
  const validSpaceData = SpaceSchema.safeParse(space);

  if (!validSpaceData.success) {
    return SettloErrorHandler.createErrorResponse(
      validSpaceData.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();
  await getAuthenticatedUser();

  const payload = buildSpacePayload(validSpaceData.data, location!.id);

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/tables-and-spaces/${location?.id}/create`,
      payload,
    );
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

export const getSpace = async (id: UUID): Promise<ApiResponse<Space>> => {
  const apiClient = new ApiClient();
  const query = {
    filters: [
      {
        key: "id",
        operator: "EQUAL",
        field_type: "UUID_STRING",
        value: id,
      },
    ],
    sorts: [],
    page: 0,
    size: 1,
  };

  const location = await getCurrentLocation();

  const spaceResponse = await apiClient.post(
    `/api/tables-and-spaces/${location?.id}`,
    query,
  );

  console.log("Space data", parseStringify(spaceResponse));
  return parseStringify(spaceResponse);
};

export const updateSpace = async (
  id: UUID,
  space: z.infer<typeof SpaceSchema>,
): Promise<FormResponse | void> => {
  const validSpaceData = SpaceSchema.safeParse(space);

  if (!validSpaceData.success) {
    return SettloErrorHandler.createErrorResponse(
      validSpaceData.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();

  const payload = buildSpacePayload(validSpaceData.data, location!.id);

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/tables-and-spaces/${location?.id}/${id}`,
      payload,
    );
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
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.delete(`/api/tables-and-spaces/${location?.id}/${id}`);
    revalidatePath("/spaces");
  } catch (error) {
    throw error;
  }
};

// ─── Floor Plans ─────────────────────────────────────────────────────

export const fetchFloorPlans = async (): Promise<FloorPlan[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.get(`/api/floor-plans/${location?.id}`);
    return parseStringify(data);
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

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/floor-plans/${location?.id}/create`,
      validated.data,
    );
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
): Promise<FormResponse | void> => {
  const validated = FloorPlanSchema.safeParse(floorPlan);

  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/floor-plans/${location?.id}/${id}`,
      validated.data,
    );
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
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.delete(`/api/floor-plans/${location?.id}/${id}`);
    revalidatePath("/spaces");
  } catch (error) {
    throw error;
  }
};

// ─── Table Combinations ──────────────────────────────────────────────

export const fetchTableCombinations = async (): Promise<TableCombination[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const data = await apiClient.get(`/api/table-combinations/${location?.id}`);
    return parseStringify(data);
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

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/table-combinations/${location?.id}/create`,
      validated.data,
    );
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
): Promise<FormResponse | void> => {
  const validated = TableCombinationSchema.safeParse(combination);

  if (!validated.success) {
    return SettloErrorHandler.createErrorResponse(
      validated.error,
      "Please fill all the required fields",
    );
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/table-combinations/${location?.id}/${id}`,
      validated.data,
    );
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
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.delete(`/api/table-combinations/${location?.id}/${id}`);
    revalidatePath("/spaces");
  } catch (error) {
    throw error;
  }
};
