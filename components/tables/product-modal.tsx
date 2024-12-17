import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,

} from "@nextui-org/modal";

import { Product } from "@/types/product/type";
import { Card, CardContent, CardHeader } from "../ui/card";

interface ProductModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  data: Product;
}

export default function ProductModal({

  isOpen, onOpenChange, data }: ProductModalProps) {

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
        style={{ background: '#FAFAFA' }}
      >
        <ModalContent>

          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 mt-2">

              </ModalHeader>
              <ModalBody className="max-h-[70vh] overflow-y-auto">
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-normal">Product Details</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="border border-gray-300 rounded-md">
                      <div className="flex items-center border-b border-gray-300 p-2">
                        <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Product</span>
                        <span className="w-2/3 pl-2">{data.name}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-300 p-2">
                        <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Category</span>
                        <span className="w-2/3 pl-2 text-sm">{data.categoryName}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-300 p-2">
                        <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Department</span>
                        <span className="w-2/3 pl-2">{data.departmentName}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-300 p-2">
                        <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Brand</span>
                        <span className="w-2/3 pl-2">{data.brandName ? data.brandName : <span className="text-sm">None</span>}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-300 p-2">
                        <span className="w-1/3 font-normal border-r border-gray-300 pr-2">SKU</span>
                        <span className="w-2/3 pl-2 text-sm">{data.sku ? data.sku : <span className="text-sm">None</span>}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-300 p-2">
                        <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Track Inventory</span>
                        <span className="w-2/3 pl-2 text-sm">{data.trackInventory === true ? <span className="bg-emerald-500 text-sm text-white rounded-sm p-1">Yes</span> : <span className="text-sm">No</span>}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-300 p-2">
                        <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Sell Online</span>
                        <span className="w-2/3 pl-2">{data.sellOnline === true ? <span className="bg-emerald-500 text-sm text-white rounded-sm p-2">Yes</span> : <span className="text-sm">No</span>}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-300 p-2">
                        <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Sell Online</span>
                        <span className="w-2/3 pl-2">{data.taxIncluded === true ? <span className="bg-emerald-500 text-sm text-white rounded-sm p-2">Yes</span> : <span className="text-sm">No</span>}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-300 p-2">
                        <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Tax Class</span>
                        <span className="w-2/3 pl-2 text-sm">{data.taxClass}</span>
                      </div>
                      <div className="flex items-center p-2 border-b border-gray-300">
                        <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Description</span>
                        <span className="w-2/3 pl-2 text-sm">{data.description}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>


                {data.variants && (
                  <Card className="mt-4">
                    <CardHeader>
                      <h3 className="text-md font-semibold">Variants</h3>
                    </CardHeader>
                    <CardContent>
                      
                        {data.variants.map((variant, index) => (
                          <div key={index} className="border border-gray-300 rounded-md mb-4">
                          <div  className="border-b border-gray-300 ">
                            <div className="flex items-center p-2 border-b border-gray-300">
                              <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Name</span>
                              <span className="w-2/3 pl-2 text-sm">{variant.name}</span>
                            </div>
                            <div className="flex items-center p-2 border-b border-gray-300">
                              <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Price</span>
                              <span className="w-2/3 pl-2 text-sm">{Intl.NumberFormat().format(variant.price)}</span>
                            </div>
                            <div className="flex items-center p-2 border-b border-gray-300">
                              <span className="w-1/3 font-normal border-r border-gray-300 pr-2">SKU</span>
                              <span className="w-2/3 pl-2 text-sm">{variant.sku}</span>
                            </div>
                            <div className="flex items-center p-2 border-b border-gray-300">
                              <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Barcode</span>
                              <span className="w-2/3 pl-2 text-sm">{variant.barcode}</span>
                            </div>
                            <div className="flex items-center p-2 border-b border-gray-300">
                              <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Unit</span>
                              <span className="w-2/3 pl-2 text-sm">{variant.unitName}</span>
                            </div>
                            <div className="flex items-center p-2 border-b border-gray-300">
                              <span className="w-1/3 font-normal border-r border-gray-300 pr-2">Description</span>
                              <span className="w-2/3 pl-2 text-sm">{variant.description}</span>
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
