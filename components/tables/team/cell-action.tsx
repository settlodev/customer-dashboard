"use client";

import React, { useState } from "react";
import { MoreVertical, Mail, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AccountMember, removeMember, resendInvitation } from "@/lib/actions/account-member-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteModal from "@/components/tables/delete-modal";

interface CellActionProps {
  data: AccountMember;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  const handleResend = async () => {
    const result = await resendInvitation(data.id);
    toast({
      variant: result.responseType === "success" ? "success" : "destructive",
      title: result.message,
    });
  };

  const handleRemove = async () => {
    try {
      const result = await removeMember(data.id);
      toast({ variant: result.responseType === "success" ? "success" : "destructive", title: result.message });
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {data.pending && (
            <DropdownMenuItem onClick={handleResend}>
              <Mail className="mr-2 h-4 w-4" />
              Resend Invitation
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteModal
        isOpen={isDeleteOpen}
        itemName={`${data.firstName} ${data.lastName}`}
        onDelete={handleRemove}
        onOpenChange={() => setDeleteOpen(false)}
      />
    </>
  );
};
