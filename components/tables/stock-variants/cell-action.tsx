import React from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Pencil,
  MoreHorizontal,
  ArrowDownToLine,
  FileSignature,
  ArrowLeftRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StockVariant } from "@/types/stockVariant/type";

interface CellActionProps {
  data: StockVariant;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  console.log("The data from api is", data);
  const router = useRouter();

  const handleRedirect = (id: string) => {
    router.push(`/stock-variants/${id}?stock=${data.stock}`);
  };

  const handleRedirectUpdateStock = (id: string) => {
    router.push(`/stocks/${id}`);
  };

  const handleStockIntake = (id: string) => {
    router.push(`/stock-intakes/new?stockItem=${id}`);
  };

  const handleStockModification = (id: string) => {
    router.push(`/stock-modifications/new?stockItem=${id}`);
  };

  const handleStockTransfer = (id: string) => {
    router.push(`/stock-transfers/new?stockItem=${id}`);
  };

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

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Stock Operations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleStockIntake(data.id)}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            <span>Stock Intake</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStockModification(data.id)}>
            <FileSignature className="mr-2 h-4 w-4" />
            <span>Stock Modification</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStockTransfer(data.id)}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            <span>Stock Transfer</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CellAction;
