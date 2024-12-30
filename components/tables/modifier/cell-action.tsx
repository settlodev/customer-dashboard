"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

import DeleteModal from "@/components/tables/delete-modal";
import {toast} from "@/hooks/use-toast";
import {DeleteIcon, EditIcon, EyeIcon} from "@nextui-org/shared-icons";

import { Modifier } from "@/types/modifiers/type";
import { deleteModifier } from "@/lib/actions/modifier-actions";
import ModifierModal from "../modifier-modal";

interface CellActionProps {
    data: Modifier;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const router = useRouter();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [isModifierModalOpen, setModifierModalOpen] = useState<boolean>(false);
  

    const handleDelete = async () => {
        try {
            if (data) {
                await deleteModifier(data.id);
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Modifier deleted successfully!",
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
                        onClick={() => setModifierModalOpen(true)}
                        className="cursor-pointer"
                    >
                        <EyeIcon color={'#384B70'} />
                    </a>
                    <a style={{flex: 1}} onClick={() => router.push(`/modifiers/${data.id}`)} className="cursor-pointer">
                        <EditIcon color={'#384B70'} className=" w-5 h-5"/>
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

            {/* Recipe Modal */}
            <ModifierModal
                isOpen={isModifierModalOpen}
                onOpenChange={() => setModifierModalOpen(false)}
                data={data}
            />
        </>
    )
}
