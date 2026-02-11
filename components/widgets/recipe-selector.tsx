// import { Recipe } from "@/types/recipe/type";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";
// import { useEffect, useState } from "react";
// import { fetchRecipes } from "@/lib/actions/recipe-actions";
//
// interface RecipeProps {
//   label?: string;
//   placeholder: string;
//   isRequired?: boolean;
//   value?: string;
//   isDisabled?: boolean;
//   description?: string;
//   onChange: (value: string) => void;
//   onBlur?: () => void;
// }
// function RecipeSelector({
//   placeholder,
//   value,
//   isDisabled,
//   onChange,
// }: RecipeProps) {
//   const [recipes, setRecipes] = useState<Recipe[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//
//   useEffect(() => {
//     async function loadRecipes() {
//       try {
//         setIsLoading(true);
//         const fetchedRecipes = await fetchRecipes();
//         setRecipes(fetchedRecipes);
//       } catch (error: any) {
//         console.log("Error fetching recipes:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     loadRecipes();
//   }, []);
//   return (
//     <div className="space-y-2">
//       <Select
//         defaultValue={value}
//         disabled={isDisabled || isLoading}
//         value={value}
//         onValueChange={onChange}
//       >
//         <SelectTrigger className="w-full">
//           <SelectValue placeholder={placeholder || "Select recipe"} />
//         </SelectTrigger>
//         <SelectContent>
//           {recipes.map((recipe) => (
//             <SelectItem key={recipe.id} value={recipe.id}>
//               {recipe.name}
//             </SelectItem>
//           ))}
//         </SelectContent>
//       </Select>
//     </div>
//   );
// }
// export default RecipeSelector;

import { Recipe } from "@/types/recipe/type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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

  console.log("📋 [RECIPE_SELECTOR] Component rendered with:", {
    value,
    isDisabled,
    recipesCount: recipes.length,
    isLoading,
  });

  useEffect(() => {
    console.log("📋 [RECIPE_SELECTOR] Mount - fetching recipes");

    async function loadRecipes() {
      try {
        setIsLoading(true);
        const fetchedRecipes = await fetchRecipes();
        console.log("📋 [RECIPE_SELECTOR] Recipes fetched:", {
          count: fetchedRecipes.length,
          recipes: fetchedRecipes.map((r) => ({ id: r.id, name: r.name })),
        });
        setRecipes(fetchedRecipes);
      } catch (error: any) {
        console.error("❌ [RECIPE_SELECTOR] Error fetching recipes:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipes();
  }, []);

  return (
    <div className="space-y-2">
      <Select
        defaultValue={value}
        disabled={isDisabled || isLoading}
        value={value}
        onValueChange={(newValue) => {
          console.log("📋 [RECIPE_SELECTOR] Value changed:", {
            from: value,
            to: newValue,
          });
          onChange(newValue);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder || "Select recipe"} />
        </SelectTrigger>
        <SelectContent>
          {recipes.map((recipe) => (
            <SelectItem key={recipe.id} value={recipe.id}>
              {recipe.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default RecipeSelector;
