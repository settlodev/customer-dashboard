import { Recipe } from "@/types/recipe/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useEffect, useState } from "react";
import { fetchRecipes } from "@/lib/actions/recipe-actions";

interface RecipeProps {
    label?: string;
    placeholder: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
}
function RecipeSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
}: RecipeProps) {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadRecipes() {
            try {
                setIsLoading(true);
                const fetchedRecipes = await fetchRecipes();
                setRecipes(fetchedRecipes);
            } catch (error: any) {
                console.log("Error fetching recipes:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadRecipes();
    }, []);
    return (
        // <Select value={value} onValueChange={onChange} disabled={isDisabled}>
        //     <SelectTrigger>
        //         <SelectValue placeholder={placeholder || "Select stock"}/>
        //     </SelectTrigger>
        //     <SelectContent>
        //         {recipes && recipes.length > 0 ?
        //             recipes.map((item, index) => {
        //                 return <SelectItem key={index} value={item.id}>
        //                     {item.name}
        //                 </SelectItem>
        //             })
        //             : <></>}
        //     </SelectContent>
        // </Select>
        <div className="space-y-2">
        <Select
            defaultValue={value}
            disabled={isDisabled || isLoading}
            value={value}
            onValueChange={onChange}
        >
            <SelectTrigger className="w-full">
                <SelectValue
                    placeholder={placeholder || "Select department"}
                />
            </SelectTrigger>
            <SelectContent>
                {recipes.map((recipe) => (
                    <SelectItem
                        key={recipe.id}
                        value={recipe.id}
                    >
                        {recipe.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        
    </div>
    )
}
export default RecipeSelector
