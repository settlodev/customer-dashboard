import React from "react";
import { useRouter } from "next/navigation";
import { 
  Eye, 
  Pencil, 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StockVariant } from "@/types/stockVariant/type";

interface CellActionProps {
  data: StockVariant;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();

  const handleRedirect = (id: string) => {
    
    router.push(`/warehouse-stock-variants/${id}?stock=${data.stock}`);
  };

  const handleRedirectUpdateStock = (id: string) => {
    router.push(`/warehouse-stocks/${id}`);
  };

  // const handleStockIntake = (id: string) => {
  //   router.push(`/stock-intakes/new?stockItem=${id}`);
  // };

  // const handleStockModification = (id: string) => {
  //   router.push(`/stock-modifications/new?stockItem=${id}`);
  // };

  // const handleStockTransfer = (id: string) => {
  //   router.push(`/stock-transfers/new?stockItem=${id}`);
  // };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => handleRedirect(data.id)}
      >
        <Eye className="h-4 w-4 text-slate-600" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => handleRedirectUpdateStock(data.stock)}
      >
        <Pencil className="h-4 w-4 text-slate-600" />
      </Button>

    
    </div>
  );
};

export default CellAction;