"use client";

import { EyeIcon, Receipt} from "lucide-react";
import { useRouter } from "next/navigation";
import { Orders } from "@/types/orders/type";

interface CellActionProps {
    data: Orders;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    // console.log(data);
    const router = useRouter();
    return (
    
    <div className="relative flex items-center gap-2">
        <EyeIcon className="cursor-pointer" onClick={() => router.push(`/orders/${data.id}`)} />
        <Receipt className="cursor-pointer" onClick={() => router.push(`/receipt/${data.id}`)} />
    </div>
    );
};
