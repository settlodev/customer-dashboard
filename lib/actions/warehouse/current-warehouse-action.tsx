"use server";
import { deleteActiveLocationCookie } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export const getCurrentWarehouse = async (): Promise<any | undefined> => {
  const cookieStore = await cookies();
  const warehouseCookie = cookieStore.get("currentWarehouse");
  if (!warehouseCookie) return undefined;

  try {
    return JSON.parse(warehouseCookie.value) as any;
  } catch (error) {
    console.error("Failed to parse Warehouse cookie:", error);

    return undefined;
  }
};
export const refreshWarehouse = async (data: any): Promise<void> => {
  if (!data) throw new Error("Business ID is required to perform this request");

  await deleteActiveLocationCookie();

  const cookieStore = await cookies();
  cookieStore.set({
    name: "currentWarehouse",
    value: JSON.stringify(data),
    sameSite: "strict",
  });

  revalidatePath("/warehouse");
};

export const deleteActiveWarehouseCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("activeWarehouse");
  console.log("Deleting current warehouse cookies");
};

