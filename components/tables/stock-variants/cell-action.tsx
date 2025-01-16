"use client";

import { useRouter } from "next/navigation";
import React from "react";
import {EyeIcon} from "@nextui-org/shared-icons";
import { StockVariant } from "@/types/stockVariant/type";

interface CellActionProps {
    data: StockVariant;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const router = useRouter();

    const handleRedirect = (id: string) => {
        router.push(`/stock-variants/${id}`);
    };
  
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
                    
                </div>
            </div>
        </>
    )
}
