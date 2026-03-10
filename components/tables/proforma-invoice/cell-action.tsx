"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

import DeleteModal from "@/components/tables/delete-modal";
import { toast } from "@/hooks/use-toast";
import { DeleteIcon, EditIcon, EyeIcon } from "@nextui-org/shared-icons";

import { deleteProduct } from "@/lib/actions/product-actions";
import { Product } from "@/types/product/type";
import ProductModal from "../product-modal";
import { Proforma } from "@/types/proforma/type";

interface CellActionProps {
  data: Proforma;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div style={{ alignItems: "flex-end" }}>
        <div
          style={{
            display: "flex",
            float: "right",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            fontSize: 20,
          }}
        >
          <a
            style={{ flex: 1 }}
            onClick={() => router.push(`/proforma-invoice/details/${data.id}`)}
            className="cursor-pointer"
          >
            <EyeIcon color={"#384B70"} />
          </a>
          <a
            style={{ flex: 1 }}
            onClick={() => router.push(`/proforma-invoice/${data.id}`)}
            className="cursor-pointer"
          >
            <EditIcon color={"#384B70"} />
          </a>
        </div>
      </div>
    </>
  );
};
