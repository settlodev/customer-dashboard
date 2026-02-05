"use client";

import React from "react";

import { StockTransfer } from "@/types/stock-transfer/type";
import { StockPurchase } from "@/types/stock-purchases/type";
import { useRouter } from "next/navigation";
import { EyeIcon, Receipt } from "lucide-react";

interface CellActionProps {
  data: StockPurchase;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  console.log("Stock purchase data", data);
  const router = useRouter();
  return (
    <div className="relative flex items-center gap-2">
      <EyeIcon
        className="cursor-pointer"
        onClick={() => router.push(`/stock-purchases/${data.orderNumber}`)}
      />
    </div>
  );
};
