"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { Pencil as EditIcon, Eye as EyeIcon } from "lucide-react";
import { isProformaEditable } from "@/types/proforma/type";
import type { Proforma } from "@/types/proforma/type";

interface CellActionProps {
  data: Proforma;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const canEdit = isProformaEditable(data.proformaStatus);

  return (
    <div className="flex items-center justify-end gap-4">
      <button
        type="button"
        onClick={() => router.push(`/proforma-invoice/details/${data.id}`)}
        className="cursor-pointer"
        title="View proforma"
      >
        <EyeIcon color="#384B70" size={20} />
      </button>

      {canEdit && (
        <button
          type="button"
          onClick={() => router.push(`/proforma-invoice/${data.id}`)}
          className="cursor-pointer"
          title="Edit proforma"
        >
          <EditIcon color="#384B70" size={20} />
        </button>
      )}
    </div>
  );
};
