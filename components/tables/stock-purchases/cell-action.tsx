"use client";

import React from "react";

import { StockPurchase } from "@/types/stock-purchases/type";
import { useRouter } from "next/navigation";
import { EyeIcon } from "lucide-react";

interface CellActionProps {
  data: StockPurchase;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
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
