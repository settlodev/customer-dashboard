"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import { ApiResponse, FormResponse } from "@/types/types";
import { Category } from "@/types/category/type";
import { CategorySchema } from "@/types/category/schema";
import { inventoryUrl } from "./inventory-client";
import { getCurrentDestination } from "./context";

export async function fetchAllCategories(): Promise<Category[] | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/categories?size=200&sortBy=sortOrder&sortDirection=ASC"));
    const page = parseStringify(data) as ApiResponse<Category>;
    return page.content;
  } catch {
    return null;
  }
}

export async function getCategoryTree(): Promise<Category[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/categories/tree"));
    return parseStringify(data);
  } catch {
    return [];
  }
}

// The backend's flat list endpoint orders only by sortOrder, so children
// land wherever their sortOrder places them in the global list rather
// than under their parent. We flatten the tree depth-first here so the
// list view can render proper hierarchy without server changes.
export async function fetchCategoriesHierarchical(): Promise<Category[]> {
  const all = await fetchAllCategories();
  if (!all || all.length === 0) return [];

  const byId = new Map<string, Category>();
  for (const c of all) byId.set(c.id, c);

  const ROOT = "__root__";
  const childrenByParent = new Map<string, Category[]>();
  for (const c of all) {
    const key = c.parentId && byId.has(c.parentId) ? c.parentId : ROOT;
    const arr = childrenByParent.get(key) ?? [];
    arr.push(c);
    childrenByParent.set(key, arr);
  }

  for (const arr of childrenByParent.values()) {
    arr.sort((a, b) => {
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      return so !== 0 ? so : a.name.localeCompare(b.name);
    });
  }

  const result: Category[] = [];
  const visited = new Set<string>();
  const visit = (parentKey: string) => {
    for (const item of childrenByParent.get(parentKey) ?? []) {
      if (visited.has(item.id)) continue;
      visited.add(item.id);
      result.push(item);
      visit(item.id);
    }
  };
  visit(ROOT);

  return result;
}

export async function searchCategories(
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Category>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (q) params.set("name", q);
    params.set("page", String(page ? page - 1 : 0));
    params.set("size", String(pageLimit || 10));
    params.set("sortBy", "sortOrder");
    params.set("sortDirection", "ASC");

    const data = await apiClient.get(
      inventoryUrl(`/api/v1/categories?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
}

export async function createCategory(
  category: z.infer<typeof CategorySchema>,
  path: string,
): Promise<FormResponse<Category>> {
  const validated = CategorySchema.safeParse(category);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(inventoryUrl("/api/v1/categories"), {
      locationType: (await getCurrentDestination())?.type ?? "LOCATION",
      name: validated.data.name,
      description: validated.data.description,
      imageUrl: validated.data.imageUrl,
      parentId: validated.data.parentId || undefined,
      departmentId: validated.data.departmentId || undefined,
      sortOrder: validated.data.sortOrder,
    });

    revalidatePath(path);

    return parseStringify({
      responseType: "success",
      message: "Category created successfully",
      data: parseStringify(response),
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create category",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function getCategory(id: string): Promise<Category> {
  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`/api/v1/categories/${id}`));
  return parseStringify(data);
}

export async function updateCategory(
  id: string,
  category: z.infer<typeof CategorySchema>,
  context: "product" | "category",
): Promise<FormResponse | void> {
  const validated = CategorySchema.safeParse(category);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(inventoryUrl(`/api/v1/categories/${id}`), {
      name: validated.data.name,
      description: validated.data.description,
      imageUrl: validated.data.imageUrl,
      parentId: validated.data.parentId || undefined,
      removeParent: validated.data.parentId === null || validated.data.parentId === "",
      // Department is mandatory; the schema guarantees a UUID is present.
      departmentId: validated.data.departmentId,
      sortOrder: validated.data.sortOrder,
      active: validated.data.active,
    });
  } catch (error) {
    return parseStringify({
      responseType: "error",
      message: "Something went wrong while processing your request",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  if (context === "category") {
    revalidatePath("/categories");
    redirect("/categories");
  }

  return parseStringify({
    responseType: "success",
    message: "Category updated successfully",
  });
}

export async function deleteCategory(id: string): Promise<void> {
  if (!id) throw new Error("Category ID is required");

  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/categories/${id}`));
  revalidatePath("/categories");
}

export async function archiveCategory(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/categories/${id}/archive`), {});
    revalidatePath("/categories");
    return { responseType: "success", message: "Category archived" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to archive category",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function unarchiveCategory(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/categories/${id}/unarchive`), {});
    revalidatePath("/categories");
    return { responseType: "success", message: "Category restored" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to restore category",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
