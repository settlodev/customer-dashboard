"use client";

import { EyeIcon, Receipt, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Orders } from "@/types/orders/type";

interface CellActionProps {
  data: Orders;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  return (
    <div className="relative flex items-center gap-2">
      <EyeIcon
        className="cursor-pointer"
        onClick={() => router.push(`/orders/${data.id}`)}
      />
      <Receipt
        className="cursor-pointer"
        onClick={() =>
          router.push(`/receipt/${data.id}?location=${data.location}`)
        }
      />
      {data.orderStatus === "CLOSED" && (
        <Truck
          className="cursor-pointer"
          onClick={() =>
            router.push(
              `/delivery-note/shared/${data.id}?location=${data.location}`,
            )
          }
        />
      )}
    </div>
  );
};
