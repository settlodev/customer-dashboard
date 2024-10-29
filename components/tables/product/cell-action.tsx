"use client";

import { useRouter } from "next/navigation";
import React from "react";

import DeleteModal from "@/components/tables/delete-modal";
import {useDisclosure} from "@nextui-org/modal";
import {toast} from "@/hooks/use-toast";
import {DeleteIcon, EditIcon, EyeIcon} from "@nextui-org/shared-icons";

import {deleteProduct} from "@/lib/actions/product-actions";
import { Product } from "@/types/product/type";

interface CellActionProps {
    data: Product;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const router = useRouter();
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
  

    const onDelete = async () => {
        try {
            if (data) {
                await deleteProduct(data.id);
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Product deleted successfully!",
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
            onOpenChange();
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
                    <a style={{flex: 1}} onClick={() => router.push(`/products/${data.id}`)} className="cursor-pointer">
                        <EyeIcon color={'#384B70'}/>
                    </a>
                    <a style={{flex: 1}} onClick={() => router.push(`/products/${data.id}`)} className="cursor-pointer">
                        <EditIcon color={'#384B70'}/>
                    </a>
                    {data.canDelete ?
                        <a style={{flex: 1}} onClick={onOpen} className="cursor-pointer">
                            <DeleteIcon color={'#D91656'}/>
                        </a> :
                        <a style={{flex: 1}} onClick={onOpen}>
                            <DeleteIcon color={'#ddd'}/>
                        </a>}
                </div>
            </div>

            {data.canDelete && (
                <DeleteModal
                    isOpen={isOpen}
                    itemName={data.name}
                    onDelete={onDelete}
                    onOpenChange={onOpenChange}
                />
            )}
        </>
    )
}
