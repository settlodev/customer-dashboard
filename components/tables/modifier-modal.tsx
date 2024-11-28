import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,

} from "@nextui-org/modal";

import { Card, CardContent, CardHeader } from "../ui/card";
import { Modifier } from "@/types/modifiers/type";

interface ModifierModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  data: Modifier;
}

export default function ModifierModal({
  isOpen,
  onOpenChange,
  data,
}: ModifierModalProps) {
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
                        <h3 className="text-[16px] font-semibold">Modifier Details</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="border border-gray-300 rounded-md">
                          <div className="flex items-center border-b border-gray-300 p-2">
                            <span className="w-1/3 font-normal border-r border-gray-300 pr-2 text-sm">
                              Modifier Name
                            </span>
                            <span className="w-2/3 pl-2 text-sm">{data.name}</span>
                          </div>
                          <div className="flex items-center border-b border-gray-300 p-2">
                            <span className="w-1/3 font-normal border-r border-gray-300 pr-2 text-sm">
                              Product Variant
                            </span>
                            <span className="w-2/3 pl-2 text-sm">
                              {data.variantName}
                            </span>
                          </div>
                          
                          <div className="flex items-center border-b border-gray-300 p-2">
                            <span className="w-1/3 font-normal border-r border-gray-300 pr-2 text-sm">
                              Is Required
                            </span>
                            <span className="w-2/3 pl-2 text-sm">
                              {data.isMandatory === true ? (
                                <span className="bg-emerald-500 text-sm text-white rounded-sm p-1">
                                  Required
                                </span>
                              ) : (
                                <span className="text-sm">Not Required</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center border-b border-gray-300 p-2">
                            <span className="w-1/3 font-normal border-r border-gray-300 pr-2 text-sm">
                              Is Maximum
                            </span>
                            <span className="w-2/3 pl-2 text-sm">
                              {data.isMaximum === true ? (
                                <span className="bg-emerald-500 text-sm text-white rounded-sm p-1">
                                  Yes
                                </span>
                              ) : (
                                <span className="text-sm">No</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center border-b border-gray-300 p-2">
                            <span className="w-1/3 font-normal border-r border-gray-300 pr-2 text-sm">
                              Maximum Selection
                            </span>
                            <span className="w-2/3 pl-2 text-sm">
                              {data.maximumSelection}
                            </span>
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

                    {data.modifierItems && (
                      <Card className="mt-3">
                        <CardHeader>
                          <h4 className="text-md font-semibold">Modifier Items</h4>
                        </CardHeader>
                        <CardContent>
                          {data.modifierItems.map((item, index) => (
                            <div
                              key={index}
                              className="border border-gray-300 rounded-md mb-4"
                            >
                              <div className="border-b border-gray-300">
                                <div className="flex items-center p-2 border-b border-gray-300">
                                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2 text-sm">
                                    Item
                                  </span>
                                  <span className="w-2/3 pl-2 text-sm">
                                    {item.name}
                                  </span>
                                </div>
                                <div className="flex items-center p-2 border-b border-gray-300">
                                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2 text-sm">
                                    Price
                                  </span>
                                  <span className="w-2/3 pl-2 text-sm">
                                  {new Intl.NumberFormat('en-US').format(item.price)}
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
