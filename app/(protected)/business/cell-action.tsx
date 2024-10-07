"use client";

import {Edit, MoreHorizontal, RefreshCcwIcon, Trash} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteModal from "@/components/tables/delete-modal";
import {useDisclosure} from "@nextui-org/modal";
import {toast} from "@/hooks/use-toast";
import {Business} from "@/types/business/type";
import {DeleteIcon, EditIcon, EyeIcon, ArrowRightIcon} from "@nextui-org/shared-icons";
import {deleteBusiness} from "@/lib/actions/business/delete";
import {refreshBusiness} from "@/lib/actions/business/refresh";

interface CellActionProps {
  data: Business;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  /*const user = sessionStorage.getItem('authToken');
  console.log("user is:", user);*/

  const onDelete = async () => {
    try {
      if (data) {
        await deleteBusiness(data.id);
        toast({
          variant: "default",
          title: "Success",
          description: "Business deleted successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description:
              "There was an issue with your request, please try again later",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description:
            //error.message ||
            "There was an issue with your request, please try again later",
      });
    } finally {
      onOpenChange();
    }
  };

  const onRefreshBusiness = async (data: Business) => {
    await refreshBusiness(data);
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
            <a style={{flex: 1}} onClick={()=>onRefreshBusiness(data)} className="cursor-pointer">
              <ArrowRightIcon color={'#384B70'}/>
            </a>
            <a style={{flex: 1}} onClick={() => router.push(`/business/${data.id}`)} className="cursor-pointer">
              <EyeIcon color={'#384B70'}/>
            </a>
            <a style={{flex: 1}} onClick={() => router.push(`/business/${data.id}`)} className="cursor-pointer">
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
        <div className="relative flex items-center gap-2">
          {/*<DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0" variant="ghost">
              <span className="sr-only">Actions</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/businesses/${data.id}`)}>
              <Edit className="mr-2 h-4 w-4" /> Update
            </DropdownMenuItem>
            {data.canDelete && (
              <>
                <DropdownMenuItem onClick={onOpen}>
                  <Trash className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>*/}
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
