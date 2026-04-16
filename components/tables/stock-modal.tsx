import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Details</DialogTitle>
        </DialogHeader>
        <div className="py-4">
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
                    Stock status
                  </span>
                  <span className="w-2/3 pl-2 text-sm">
                    {!data.archived ? (
                      <span className="bg-emerald-500 text-sm text-white rounded-sm p-1">
                        Yes
                      </span>
                    ) : (
                      <span className="text-sm">No</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center border-b border-gray-300 p-2 gap-3">
                  <span className="w-1/3 font-normal border-r border-gray-300">
                    Description
                  </span>
                  <span className="w-2/3 pl-2 text-sm line-clamp-3 overflow-hidden text-ellipsis">
                    {data.description}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {data.variants && (
            <Card className="mt-3">
              <CardHeader>
                <h4 className="text-md font-semibold">Variants</h4>
              </CardHeader>
              <CardContent>
                {data.variants.map((variant, index) => (
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
                          Unit
                        </span>
                        <span className="w-2/3 pl-2 text-sm">
                          {variant.unitAbbreviation} (×{variant.conversionToBase})
                        </span>
                      </div>
                      {variant.serialTracked && (
                        <div className="flex items-center p-2 border-b border-gray-300">
                          <span className="w-1/3 font-normal border-r border-gray-300 pr-2">
                            Serial Tracked
                          </span>
                          <span className="w-2/3 pl-2 text-sm">
                            Yes
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
