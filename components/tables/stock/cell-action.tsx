"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

import DeleteModal from "@/components/tables/delete-modal";
import {toast} from "@/hooks/use-toast";
import {DeleteIcon, EditIcon, EyeIcon} from "@nextui-org/shared-icons";

import { Stock } from "@/types/stock/type";
import { deleteStock } from "@/lib/actions/stock-actions";
import StockModal from "../stock-modal";

interface CellActionProps {
    data: Stock;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    console.log(data);
    const router = useRouter();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isStockModalOpen, setStockModalOpen] = useState(false);
  

    const handleDelete = async () => {
        try {
            if (data) {
                await deleteStock(data.id);
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Stock deleted successfully!",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Uh oh! Something went wrong.",
                    description: "There was an issue with your request, please try again later",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description:
                    (error as Error).message ||
                    "There was an issue with your request, please try again later",
            });
        } finally {
            setDeleteModalOpen(false);
        }
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
                        onClick={() => setStockModalOpen(true)}
                        className="cursor-pointer"
                    >
                        <EyeIcon color={'#384B70'} />
                    </a>
                    <a style={{flex: 1}} onClick={() => router.push(`/stocks/${data.id}`)} className="cursor-pointer">
                        <EditIcon color={'#384B70'}/>
                    </a>
                    {data.canDelete ? (
                        <a
                            style={{ flex: 1 }}
                            onClick={() => setDeleteModalOpen(true)}
                            className="cursor-pointer"
                        >
                            <DeleteIcon color={'#D91656'} />
                        </a>
                    ) : (
                        <a style={{ flex: 1 }}>
                            <DeleteIcon color={'#ddd'} />
                        </a>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {data.canDelete && (
                <DeleteModal
                    isOpen={isDeleteModalOpen}
                    itemName={data.name}
                    onDelete={handleDelete}
                    onOpenChange={()=>setDeleteModalOpen(false)}
                />
            )}

            {/* Product Modal */}
            <StockModal
                isOpen={isStockModalOpen}
                onOpenChange={() => setStockModalOpen(false)}
                data={data}
            />
        </>
    )
}
