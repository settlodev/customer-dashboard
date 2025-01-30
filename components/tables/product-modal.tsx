import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@nextui-org/modal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Tag, 
  Building2, 
  Barcode, 
  Globe, 
  ClipboardCheck,
  DollarSign,
  Info,
  Box
} from "lucide-react";
import { Product } from "@/types/product/type";

interface ProductModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  data: Product;
}

export default function ProductModal({ isOpen, onOpenChange, data }: ProductModalProps) {
  const formatCurrency = (amount: string | number | bigint) => {
    if (typeof amount === 'string') {
      return new Intl.NumberFormat().format(Number(amount));
    }
    return new Intl.NumberFormat().format(amount);
  };

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
            radius="lg"
            size="xl"
            onOpenChange={onOpenChange}
            style={{ background: '#FAFAFA' }}
          >
            <ModalContent>
              {() => (
                <>
                  <ModalHeader className="flex flex-col gap-1 border-b">
                    <div className="flex items-center justify-between">
                      <h1 className="text-xl font-semibold">{data.name}</h1>
                     
                    </div>
                  </ModalHeader>

                  <ModalBody className="max-h-[70vh] overflow-y-auto">
                    {/* Product Details Card */}
                    <Card className="shadow-sm">
                      <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <Package className="h-5 w-5 text-gray-500" />
                        <h2 className="text-lg font-medium">Product Details</h2>
                      </CardHeader>
                      <CardContent className="grid gap-3 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Tag className="h-4 w-4" />
                              Category
                            </div>
                            <p className="font-medium">{data.categoryName}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Building2 className="h-4 w-4" />
                              Department
                            </div>
                            <p className="font-medium">{data.departmentName}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Box className="h-4 w-4" />
                              Brand
                            </div>
                            <p className="font-medium">{data.brandName || "None"}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Barcode className="h-4 w-4" />
                              SKU
                            </div>
                            <p className="font-medium">{data.sku || "None"}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <Badge 
                            variant={data.trackInventory ? "default" : "secondary"}
                            className="flex items-center gap-1"
                          >
                            <ClipboardCheck className="h-3 w-3" />
                            {data.trackInventory ? "Inventory Tracked" : "Not Tracked"}
                          </Badge>
                          <Badge 
                            variant={data.sellOnline ? "default" : "secondary"}
                            className="flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            {data.sellOnline ? "Sells Online" : "In-Store Only"}
                          </Badge>
                          <Badge 
                            variant={data.taxIncluded ? "default" : "secondary"}
                            className="flex items-center gap-1"
                          >
                            <DollarSign className="h-3 w-3" />
                            {data.taxIncluded ? "Tax Included" : "Tax Excluded"}
                          </Badge>
                        </div>

                        {data.description && (
                          <div className="mt-4">
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                              <Info className="h-4 w-4" />
                              Description
                            </div>
                            <p className="text-sm">{data.description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Variants Card */}
                    {data.variants && (
                      <Card className="mt-4 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                          <Box className="h-5 w-5 text-gray-500" />
                          <h2 className="text-lg font-medium">Variants ({data.variants.length})</h2>
                        </CardHeader>
                        <CardContent className="grid gap-4 pt-4">
                          {data.variants.map((variant, index) => (
                            <div 
                              key={index}
                              className="rounded-lg border bg-card text-card-foreground shadow-sm"
                            >
                              <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium">{variant.name}</h3>
                                  <Badge variant="outline" className="text-sm">
                                    Stock: {variant.availableStock}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-sm text-gray-500">Selling Price</p>
                                    <p className="font-semibold text-green-600">
                                      {formatCurrency(variant.price)}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm text-gray-500">Purchase Price</p>
                                    <p className="font-medium">
                                      {variant.purchasingPrice 
                                        ? formatCurrency(variant.purchasingPrice)
                                        : "Not set"}
                                    </p>
                                  </div>
                                  {variant.sku && (
                                    <div className="space-y-1">
                                      <p className="text-sm text-gray-500">SKU</p>
                                      <p className="font-medium">{variant.sku}</p>
                                    </div>
                                  )}
                                  {variant.barcode && (
                                    <div className="space-y-1">
                                      <p className="text-sm text-gray-500">Barcode</p>
                                      <p className="font-medium">{variant.barcode}</p>
                                    </div>
                                  )}
                                </div>

                                {variant.description && (
                                  <div className="pt-2 border-t">
                                    <p className="text-sm text-gray-500">{variant.description}</p>
                                  </div>
                                )}
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