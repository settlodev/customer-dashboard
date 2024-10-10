
"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import { ApiResponse, FormResponse } from "@/types/types";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {getCurrentBusiness, getCurrentLocation} from "@/lib/actions/business/get-current-business";
import { Expense } from "@/types/expense/type";
import { ExpenseSchema } from "@/types/expense/schema";

export const fetchAllExpenses = async (): Promise<Expense[]> => {
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const expenseData = await apiClient.get(
            `/api/expenses/${location?.id}`,
        );

        return parseStringify(expenseData);
    } catch (error) {
        throw error;
    }
};

export const searchExpenses = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Expense>> => {
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

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

        const location = await getCurrentLocation();

        const expensesData = await apiClient.post(
            `/api/expenses/${location?.id}`,
            query,
        );

        return parseStringify(expensesData);
    } catch (error) {
        throw error;
    }
};

export const createExpense = async (
    expense: z.infer<typeof ExpenseSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validatedExpenseData = ExpenseSchema.safeParse(expense);
    console.log("The validated data is:", validatedExpenseData)

    if (!validatedExpenseData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedExpenseData.error.message),
        };

        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();
  
    const payload = {
      ...validatedExpenseData.data,
      location: location?.id,
      business: business?.id,
    };

    try {
        const apiClient = new ApiClient();
        

        await apiClient.post(
            `/api/expenses/${location?.id}/create`,
            payload
        );
    } catch (error: unknown) {
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse) {
        return parseStringify(formResponse);
    }

    revalidatePath("/expenses");
    redirect("/expenses");
};


export const updateExpense = async (
    id: UUID,
    expense: z.infer<typeof ExpenseSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validatedExpenseData = ExpenseSchema.safeParse(expense);

    if (!validatedExpenseData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validatedExpenseData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();
    const payload = {
        ...validatedExpenseData.data,
        location: location?.id,
        business: business?.id,
    };

    try {
        const apiClient = new ApiClient();

      await apiClient.put(
            `/api/expenses/${location?.id}/${id}`, 
            payload
        );

    } catch (error) {
        console.error("Error updating expense", error); 
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse) {
        return parseStringify(formResponse);
    }
    revalidatePath("/expenses");
    redirect("/expenses");
};

export const getExpense = async (id: UUID): Promise<ApiResponse<Expense>> => {
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

    const expenseData = await apiClient.post(
        `/api/expenses/${location?.id}`,
        query,
    );

    return parseStringify(expenseData);
};

export const deleteExpense = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Expense ID is required to perform this request");
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();

        await apiClient.delete(`/api/expenses/${location?.id}/${id}`);
        revalidatePath("/expenses");
    } catch (error) {
        throw error;
    }
};
