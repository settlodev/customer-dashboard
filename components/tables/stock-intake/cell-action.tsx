"use client";

import React from "react";

import {useDisclosure} from "@nextui-org/modal";
import {EyeIcon} from "@nextui-org/shared-icons";

import ItemModal from "../item-modal";
import { StockIntake } from "@/types/stock-intake/type";

interface CellActionProps {
    data: StockIntake & { stockVariant: string };
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    console.log(data);
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
  
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
                    <a style={{flex: 1}} onClick={onOpen} className="cursor-pointer">
                        <EyeIcon color={'#384B70'}/>
                    </a>
                    {/* <a style={{ flex: 1 }} onClick={() => handleEditClick()} className="cursor-pointer">
                        <EditIcon color={'#384B70'} />
                    </a> */}
                    
                </div>
            </div>

            
                 <ItemModal
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    data={data}
                />
              
        
        </>
    )
}
