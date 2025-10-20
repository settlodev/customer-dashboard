"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { EditIcon, EyeIcon } from "@nextui-org/shared-icons";
import { Recipe } from "@/types/recipe/type";
import RecipeModal from "../recipe-modal";

interface CellActionProps {
  data: Recipe;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  // const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [isRecipeModalOpen, setRecipeModalOpen] = useState<boolean>(false);

  // const handleDelete = async () => {
  //     try {
  //         if (data) {
  //             await deleteRecipe(data.id);
  //             toast({
  //                 variant: "default",
  //                 title: "Success",
  //                 description: "Recipe deleted successfully!",
  //             });
  //         } else {
  //             toast({
  //                 variant: "destructive",
  //                 title: "Uh oh! Something went wrong.",
  //                 description: "There was an issue with your request, please try again later",
  //             });
  //         }
  //     } catch (error) {
  //         toast({
  //             variant: "destructive",
  //             title: "Uh oh! Something went wrong.",
  //             description:
  //                 (error as Error).message ||
  //                 "There was an issue with your request, please try again later",
  //         });
  //     }
  // };

  return (
    <>
      <div style={{ alignItems: "flex-end" }}>
        <div
          style={{
            display: "flex",
            float: "right",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            fontSize: 20,
          }}
        >
          <a
            style={{ flex: 1 }}
            onClick={() => setRecipeModalOpen(true)}
            className="cursor-pointer"
          >
            <EyeIcon color={"#384B70"} />
          </a>
          <a
            style={{ flex: 1 }}
            onClick={() => router.push(`/recipes/${data.id}`)}
            className="cursor-pointer"
          >
            <EditIcon color={"#384B70"} className=" w-5 h-5" />
          </a>
        </div>
      </div>
      {/* Recipe Modal */}
      <RecipeModal
        isOpen={isRecipeModalOpen}
        onOpenChange={() => setRecipeModalOpen(false)}
        data={data}
      />
    </>
  );
};
