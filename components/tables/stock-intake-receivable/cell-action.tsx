"use client";

import React from "react";

import { useRouter } from "next/navigation";
import { EyeIcon } from "lucide-react";
import { StockReceipt } from "@/types/stock-intake-receipt/type";

interface CellActionProps {
  data: StockReceipt;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  return (
    <div className="relative flex items-center gap-2">
      <EyeIcon
        className="cursor-pointer"
        onClick={() => router.push(`/goods-received/${data.id}`)}
      />
    </div>
  );
};
