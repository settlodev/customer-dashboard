"use client";

import React from "react";

import { StockTransfer } from "@/types/stock-transfer/type";

interface CellActionProps {
    data: StockTransfer & { stockVariant: string };
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
