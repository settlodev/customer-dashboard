"use client";

import { OrderItemRefunds } from "@/types/refunds/type";
import { EyeIcon} from "lucide-react";
import { useRouter } from "next/navigation";

interface CellActionProps {
    data: OrderItemRefunds;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const router = useRouter();
    return (
    
    <div className="relative flex items-center gap-2">
        <EyeIcon className="cursor-pointer" onClick={() => router.push(`/orders/${data.id}`)} />
    </div>
    );
};
