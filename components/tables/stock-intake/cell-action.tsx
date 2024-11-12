"use client";

import React from "react";

import {useDisclosure} from "@nextui-org/modal";
import {EyeIcon} from "@nextui-org/shared-icons";

import { StockIntake } from "@/types/stock-intake/type";
import ItemModal from "../item-modal";

interface CellActionProps {
    data: StockIntake & { stockVariant: string };
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    // const router = useRouter();
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
  
    // const handleEditClick = () => {
    //     console.log("Data object on Edit click:", data.stockVariant); 
    //     if (data.stockVariant && data.id) {
    //         router.push(`/stock-intakes/${data.stockVariant}/${data.id}`);
    //     } else {
    //         console.error("Missing stockVariantId or id in data:", data);
    //     }
    // };

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
