import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,

} from "@nextui-org/modal";

import { Card, CardContent, CardHeader } from "../ui/card";
import { Recipe } from "@/types/recipe/type";

interface RecipeModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  data: Recipe;
}

export default function RecipeModal({
  isOpen,
  onOpenChange,
  data,
}: RecipeModalProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40">
          <Modal
            backdrop="blur"
            className="fixed right-0 top-20 h-full w-full lg:w-[28%] md:w-[58%]"
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            isOpen={isOpen}
            placement="center"
            radius="sm"
            size="xl"
            onOpenChange={onOpenChange}
          >
            <ModalContent>
              {() => (
                <>
                  <ModalHeader className="flex flex-col gap-1 mt-2"></ModalHeader>
                  <ModalBody>
                    <Card>
                      <CardHeader>
                        <h3 className="text-[16px] font-semibold">Recipe Details</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="border border-gray-300 rounded-md">
                          <div className="flex items-center border-b border-gray-300 p-2">
                            <span className="w-1/3 font-normal border-r border-gray-300 pr-2 text-sm">
                              Recipe Name
                            </span>
                            <span className="w-2/3 pl-2 text-sm">{data.name}</span>
                          </div>
                          <div className="flex items-center border-b border-gray-300 p-2">
                            <span className="w-1/3 font-normal border-r border-gray-300 pr-2 text-sm">
                              Status
                            </span>
                            <span className="w-2/3 pl-2 text-sm">
                              {data.status === true ? (
                                <span className="bg-emerald-500 text-sm text-white rounded-sm p-1">
                                  Active
                                </span>
                              ) : (
                                <span className="text-sm">No Active</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {data.recipeStockVariants && (
                      <Card className="mt-3">
                        <CardHeader>
                          <h4 className="text-md font-semibold">Variants</h4>
                        </CardHeader>
                        <CardContent>
                          {data.recipeStockVariants.map((variant, index) => (
                            <div
                              key={index}
                              className="border border-gray-300 rounded-md mb-4"
                            >
                              <div className="border-b border-gray-300">
                                <div className="flex items-center p-2 border-b border-gray-300">
                                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                                    Stock Variant
                                  </span>
                                  <span className="w-2/3 pl-2 text-sm">
                                    {variant.stockVariantName}
                                  </span>
                                </div>
                                <div className="flex items-center p-2 border-b border-gray-300">
                                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                                    Quantity
                                  </span>
                                  <span className="w-2/3 pl-2 text-sm">
                                    {variant.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </ModalBody>
                </>
              )}
            </ModalContent>
          </Modal>
        </div>
      )}
    </>
  );
}
