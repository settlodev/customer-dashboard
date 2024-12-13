"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {UUID} from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { Recipe } from "@/types/recipe/type";
import { RecipeSchema } from "@/types/recipe/schema";
import {redirect} from "next/navigation";

export const fetchRecipes = async () : Promise<Recipe[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const addonData = await  apiClient.get(
            `/api/recipes/${location?.id}`,
        );

        return parseStringify(addonData);

    }
    catch (error){
        throw error;
    }
}


export const searchRecipe = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Recipe>> =>{
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"name",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"name",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const recipeData = await  apiClient.post(
            `/api/recipes/${location?.id}`,
            query
        );

        return parseStringify(recipeData);
    }
    catch (error){
        throw error;
    }

}
export const  createRecipe= async (
    recipe: z.infer<typeof RecipeSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validRecipeData= RecipeSchema.safeParse(recipe)

    if (!validRecipeData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(validRecipeData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();

    const payload = {
        ...validRecipeData.data,
        location: location?.id,
        recipeStockVariants: validRecipeData.data.stockVariants?.map(variant => ({
            stockVariant: variant.id,
            quantity: variant.quantity
        })) ?? []
    };
    delete payload.stockVariants;

    try {
        const apiClient = new ApiClient();


        await apiClient.post(
            `/api/recipes/${location?.id}/create`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Recipe created successfully",
        };
    }
    catch (error){
        console.error("Error while creating addons",error)
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if ( formResponse?.responseType === "error") return formResponse;

    revalidatePath("/recipes")
    redirect("/recipes")
}

export const getRecipe= async (id:UUID) : Promise<ApiResponse<Recipe>> => {
    const apiClient = new ApiClient();
    const query ={
        filters:[
            {
                key: "id",
                operator: "EQUAL",
                field_type: "UUID_STRING",
                value: id,
            }
        ],
        sorts: [],
        page: 0,
        size: 1,
    }
    const location = await getCurrentLocation();
    const recipe= await apiClient.post(
        `/api/recipes/${location?.id}`,
        query,
    );

    return parseStringify(recipe)
}

export const updateRecipe = async (
    id: UUID,
    recipe: z.infer<typeof RecipeSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validRecipeData = RecipeSchema.safeParse(recipe);

    if (!validRecipeData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validRecipeData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();

    const payload = {
        ...validRecipeData.data,
        location: location?.id,
        recipeStockVariants: validRecipeData.data.stockVariants?.map(variant => ({
            stockVariant: variant.id,
            quantity: variant.quantity
        })) ?? []
    };

    delete payload.stockVariants;

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/recipes/${location?.id}/${id}`,
            payload
        );

        formResponse = {
            responseType: "success",
            message: "Recipe updated successfully",
        };

    } catch (error) {
        console.error("Error while updating recipe", error);
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse?.responseType === "error") return formResponse;

    revalidatePath("/recipes");
    redirect("/recipes");
};

export const deleteRecipe = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Recipe ID is required to perform this request");

    await getAuthenticatedUser();

    console.log("Deleting recipe with ID:", id);

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    await apiClient.delete(
        `/api/recipes/${location?.id}/${id}`,
    );
    revalidatePath("/recipes");

   }
   catch (error){
       throw error
   }
}

