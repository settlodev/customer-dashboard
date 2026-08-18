"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { Discount } from "@/types/discount/type";
import { DiscountSchema } from "@/types/discount/schema";

const oms = () => new ApiClient("orders");
const BASE = "/api/v1/discounts";

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/**
 * `GET /api/v1/discounts` returns a flat array — no Spring Data page
 * envelope (no `content`/`totalElements`/`totalPages`) — so pagination and
 * search filtering for the list page happen client-side, the same pattern
 * `fetchCategoriesHierarchical` uses.
 */
export const fetchAllDiscounts = async (): Promise<Discount[]> => {
  try {
    const data = await oms().get<Discount[]>(BASE);
    return parseStringify(data) ?? [];
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get
// ---------------------------------------------------------------------------

export const getDiscount = async (id: string): Promise<Discount> => {
  const data = await oms().get(`${BASE}/${id}`);
  return parseStringify(data);
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createDiscount(
  discount: z.infer<typeof DiscountSchema>,
): Promise<FormResponse<Discount>> {
  const validated = DiscountSchema.safeParse(discount);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const response = await oms().post<Discount, typeof validated.data>(
      BASE,
      validated.data,
    );

    revalidatePath("/discounts");
    return parseStringify({
      responseType: "success",
      message: "Discount created successfully",
      data: parseStringify(response),
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create discount",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export const updateDiscount = async (
  id: string,
  discount: z.infer<typeof DiscountSchema>,
): Promise<FormResponse<Discount>> => {
  const validated = DiscountSchema.safeParse(discount);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const response = await oms().put<Discount, typeof validated.data>(
      `${BASE}/${id}`,
      validated.data,
    );

    revalidatePath("/discounts");
    return parseStringify({
      responseType: "success",
      message: "Discount updated successfully",
      data: parseStringify(response),
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update discount",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export const deleteDiscount = async (id: string): Promise<void> => {
  if (!id) throw new Error("Discount ID is required to perform this request");

  try {
    await oms().delete(`${BASE}/${id}`);
    revalidatePath("/discounts");
  } catch (error) {
    throw error;
  }
};
