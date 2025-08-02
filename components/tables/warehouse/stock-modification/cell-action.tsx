"use client";

import React from "react";
import { StockModification } from "@/types/stock-modification/type";
interface CellActionProps {
    data: StockModification & { stockVariant: string };
}

export const CellAction: React.FC<CellActionProps> = () => {
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
                </div>
            </div>
        
        </>
    )
}
