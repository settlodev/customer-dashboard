import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Recipe } from "@/types/recipe/type";
import { getRecipe } from "@/lib/actions/recipe-actions";
import RecipeForm from "@/components/forms/recipe_form";


type Params = Promise<{ id: string }>;
export default async function RecipePage({params}: {params: Params}){

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Recipe> | null = null;

    if(!isNewItem){
        try{
            item = await  getRecipe(resolvedParams.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            console.log(error)
            throw new Error("Failed to load recipe details");
        }
    }

    const breadCrumbItems=[{title:"Recipes",link:"/recipes"},
        {title: isNewItem ? "New":item?.content[0].name || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <RecipeCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const RecipeCard =({isNewItem,item}:{
    isNewItem:boolean,
    item: Recipe | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Add Recipe" : "Edit recipe details"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Add recipe to your location": "Edit recipe details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <RecipeForm item={item}/>
        </CardContent>
    </Card>
)
