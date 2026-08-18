"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  GitMerge,
  History,
  MoreVertical,
  Pencil as EditIcon,
  XCircle,
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { BomRule } from "@/types/bom/type";
import {
  cloneBomRule,
  deprecateBomRule,
} from "@/lib/actions/bom-rule-actions";

interface CellActionProps {
  data: BomRule;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isDeprecated = data.lifecycleStatus === "DEPRECATED";

  const handleDeprecate = () => {
    startTransition(async () => {
      const res = await deprecateBomRule(data.id);
      if (res?.responseType === "success") {
        toast({ variant: "success", title: "Deprecated", description: res.message });
        router.refresh();
      } else if (res?.responseType === "error") {
        toast({ variant: "destructive", title: "Error", description: res.message });
      }
    });
  };

  const handleClone = () => {
    startTransition(async () => {
      const res = await cloneBomRule(data.id);
      if (res?.responseType === "success") {
        toast({ variant: "success", title: "Cloned", description: res.message });
        router.refresh();
      } else if (res?.responseType === "error") {
        toast({ variant: "destructive", title: "Error", description: res.message });
      }
    });
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/bom-rules/${data.id}`)}>
          <EditIcon className="mr-2 h-4 w-4" />
          {isDeprecated ? "View" : "Edit / revise"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/bom-rules/${data.id}?tab=cost`)}>
          <GitMerge className="mr-2 h-4 w-4" />
          Calculate cost
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/bom-rules/${data.id}?tab=history`)}>
          <History className="mr-2 h-4 w-4" />
          Revisions
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleClone} disabled={isPending}>
          <Copy className="mr-2 h-4 w-4" />
          Clone as new revision
        </DropdownMenuItem>
        {!isDeprecated && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDeprecate}
              disabled={isPending}
              className="text-red-600 focus:text-red-600"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Deprecate
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
