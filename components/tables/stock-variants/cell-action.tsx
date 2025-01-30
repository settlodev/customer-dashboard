"use client";

import { useRouter } from "next/navigation";
import React from "react";
import {EyeIcon} from "@nextui-org/shared-icons";
import { StockVariant } from "@/types/stockVariant/type";
import { Pencil } from "lucide-react";

interface CellActionProps {
    data: StockVariant;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const router = useRouter();
console.log(data)
    const handleRedirect = (id: string) => {
        router.push(`/stock-variants/${id}`);
    };

    const handleRedirectUpdateStock = (id: string) => {
        router.push(`/stocks/${id}`);
    }
  
    return (
        <>
            <div style={{alignItems: 'flex-end'}}>
                <div style={{
                    display: 'flex',
                    float: 'right',
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    fontSize: 20
                }}>
                   <a
                        style={{ flex: 1 }}
                        onClick={() => handleRedirect(data.id)}
                        className="cursor-pointer"
                    >
                        <EyeIcon color={'#384B70'} />
                    </a>

                    <a style={{ flex: 1 }} onClick={() => handleRedirectUpdateStock(data.stock)}
                    className="cursor-pointer"
                        >
                        <Pencil color={'#384B70'} size={16} />
                    </a>
                    
                </div>
            </div>
        </>
    )
}
