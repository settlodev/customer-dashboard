"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { Pencil as EditIcon, Eye as EyeIcon } from "lucide-react";

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
          {data.proformaStatus !== "COMPLETE" &&
            data.proformaStatus !== "ACCEPTED" && (
              <a
                style={{ flex: 1 }}
                onClick={() => router.push(`/proforma-invoice/${data.id}`)}
                className="cursor-pointer"
              >
                <EditIcon color={"#384B70"} />
              </a>
            )}
        </div>
      </div>
    </>
  );
};
