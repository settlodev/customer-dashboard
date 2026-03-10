"use server";

import { getAuthenticatedUser } from "../auth-utils";
import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { UUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentLocation } from "./business/get-current-business";
import { Space, FloorPlan, TableCombination } from "@/types/space/type";
import {
  SpaceSchema,
  FloorPlanSchema,
  TableCombinationSchema,
} from "@/types/space/schema";

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
  let formResponse: FormResponse | null = null;
  const validSpaceData = SpaceSchema.safeParse(space);

  if (!validSpaceData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validSpaceData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();
  await getAuthenticatedUser();

  const payload = {
    ...validSpaceData.data,
    location: location?.id,
  };

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/tables-and-spaces/${location?.id}/create`,
      payload,
    );
    formResponse = {
      responseType: "success",
      message: "Table/space created successfully",
    };
  } catch (error) {
    console.error("Error creating table/space", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
  revalidatePath("/spaces");
  return parseStringify(formResponse);
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
  return parseStringify(spaceResponse);
};

export const updateSpace = async (
  id: UUID,
  space: z.infer<typeof SpaceSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validSpaceData = SpaceSchema.safeParse(space);

  if (!validSpaceData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validSpaceData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  const payload = {
    ...validSpaceData.data,
    location: location?.id,
  };

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/tables-and-spaces/${location?.id}/${id}`,
      payload,
    );
    formResponse = {
      responseType: "success",
      message: "Table/space updated successfully",
    };
  } catch (error) {
    console.error("Error updating table/space", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
  revalidatePath("/spaces");
  return parseStringify(formResponse);
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
  let formResponse: FormResponse | null = null;
  const validated = FloorPlanSchema.safeParse(floorPlan);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/floor-plans/${location?.id}/create`,
      validated.data,
    );
    formResponse = {
      responseType: "success",
      message: "Floor plan created successfully",
    };
  } catch (error) {
    console.error("Error creating floor plan", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
  revalidatePath("/spaces");
  return parseStringify(formResponse);
};

export const updateFloorPlan = async (
  id: UUID,
  floorPlan: z.infer<typeof FloorPlanSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validated = FloorPlanSchema.safeParse(floorPlan);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/floor-plans/${location?.id}/${id}`,
      validated.data,
    );
    formResponse = {
      responseType: "success",
      message: "Floor plan updated successfully",
    };
  } catch (error) {
    console.error("Error updating floor plan", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
  revalidatePath("/spaces");
  return parseStringify(formResponse);
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
    const data = await apiClient.get(
      `/api/table-combinations/${location?.id}`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createTableCombination = async (
  combination: z.infer<typeof TableCombinationSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validated = TableCombinationSchema.safeParse(combination);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/table-combinations/${location?.id}/create`,
      validated.data,
    );
    formResponse = {
      responseType: "success",
      message: "Table combination created successfully",
    };
  } catch (error) {
    console.error("Error creating table combination", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
  revalidatePath("/spaces");
  return parseStringify(formResponse);
};

export const updateTableCombination = async (
  id: UUID,
  combination: z.infer<typeof TableCombinationSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validated = TableCombinationSchema.safeParse(combination);

  if (!validated.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    await apiClient.put(
      `/api/table-combinations/${location?.id}/${id}`,
      validated.data,
    );
    formResponse = {
      responseType: "success",
      message: "Table combination updated successfully",
    };
  } catch (error) {
    console.error("Error updating table combination", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
  revalidatePath("/spaces");
  return parseStringify(formResponse);
};

export const deleteTableCombination = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Table combination ID is required");
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    await apiClient.delete(
      `/api/table-combinations/${location?.id}/${id}`,
    );
    revalidatePath("/spaces");
  } catch (error) {
    throw error;
  }
};
