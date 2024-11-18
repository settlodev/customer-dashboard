import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,

} from "@nextui-org/modal";

import { Card, CardContent, CardHeader } from "../ui/card";
import { Stock } from "@/types/stock/type";

interface StockModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  data: Stock;
}

export default function StockModal({
  isOpen,
  onOpenChange,
  data,
}: StockModalProps) {
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
                        <h3 className="text-lg font-semibold">Stock Details</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="border border-gray-300 rounded-md">
                          <div className="flex items-center border-b border-gray-300 p-2">
                            <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                              Stock
                            </span>
                            <span className="w-2/3 pl-2">{data.name}</span>
                          </div>
                          <div className="flex items-center border-b border-gray-300 p-2">
                            <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                              Status
                            </span>
                            <span className="w-2/3 pl-2 text-sm">
                              {data.status === true ? (
                                <span className="bg-emerald-500 text-sm text-white rounded-sm p-1">
                                  Yes
                                </span>
                              ) : (
                                <span className="text-sm">No</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center border-b border-gray-300 p-2">
                            <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                              Description
                            </span>
                            <span className="w-2/3 pl-2 text-sm">
                              {data.description}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {data.stockVariants && (
                      <Card className="mt-3">
                        <CardHeader>
                          <h4 className="text-md font-semibold">Variants</h4>
                        </CardHeader>
                        <CardContent>
                          {data.stockVariants.map((variant, index) => (
                            <div
                              key={index}
                              className="border border-gray-300 rounded-md mb-4"
                            >
                              <div className="border-b border-gray-300">
                                <div className="flex items-center p-2 border-b border-gray-300">
                                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                                    Name
                                  </span>
                                  <span className="w-2/3 pl-2 text-sm">
                                    {variant.name}
                                  </span>
                                </div>
                                <div className="flex items-center p-2 border-b border-gray-300">
                                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                                    Price
                                  </span>
                                  <span className="w-2/3 pl-2 text-sm">
                                    {variant.startingQuantity}
                                  </span>
                                </div>
                                <div className="flex items-center p-2 border-b border-gray-300">
                                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                                    SKU
                                  </span>
                                  <span className="w-2/3 pl-2 text-sm">
                                    {variant.startingValue}
                                  </span>
                                </div>
                                <div className="flex items-center p-2 border-b border-gray-300">
                                  <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                                    Barcode
                                  </span>
                                  <span className="w-2/3 pl-2 text-sm">
                                    {variant.alertLevel}
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
