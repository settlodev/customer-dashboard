"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";
import { console } from "node:inspector";
import { UpdatedStockIntakeSchema } from "@/types/stock-intake/schema";

export const getStockIntake = async (id: UUID, effectiveStockVariant: UUID) => {
  const apiClient = new ApiClient();

  try {
    const response = await apiClient.get(
      `/api/stock-intakes/${effectiveStockVariant}/${id}`,
    );

    return parseStringify(response);
  } catch (error) {
    console.error("Error fetching stock intake:", error);
    throw error;
  }
};

export const updateStockIntake = async (
  id: UUID,
  stockIntake: z.infer<typeof UpdatedStockIntakeSchema>,
): Promise<FormResponse | void> => {
  console.log("The values are", id, stockIntake);
  let formResponse: FormResponse | null = null;
  const validData = UpdatedStockIntakeSchema.safeParse(stockIntake);

  // console.log("The validated data",validData)

  if (!validData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validData.error.message),
    };
    return parseStringify(formResponse);
  }

  const payload = {
    ...validData.data,
  };
  // console.log("The payload is",payload)

  try {
    const apiClient = new ApiClient();

    await apiClient.post(
      `/api/stock-intake-value-modifications/${id}`,
      payload,
    );
    formResponse = {
      responseType: "success",
      message: "Stock Intake Value updated successfully",
    };
  } catch (error) {
    console.error("Error updating stock", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/stock-intakes");
  return parseStringify(formResponse);
};

// CSV upload + sample download were migrated off the Rust service. Upload is
// now handled by /api/v1/imports — see lib/actions/import-actions.ts. The
// /imports/stock-intake page exposes its own "Download CSV template" button,
// so the sample-download is no longer fanned out from here.

export const downloadStockIntakeCSV = async (): Promise<Blob | string> => {
  throw new Error("Stock intake CSV export is not available yet.");
};
