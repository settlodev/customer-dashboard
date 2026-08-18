import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Plus, Puzzle } from "lucide-react";
import type { Addon } from "@/types/billing/types";
import { cn } from "@/lib/utils";

interface AdditionalServiceCardProps {
  service: Addon;
  isAdded: boolean;
  onAdd: (service: Addon) => void;
}

const AdditionalServiceCard: React.FC<AdditionalServiceCardProps> = ({
  service,
  isAdded,
  onAdd,
}) => {
  return (
    <div
      className={cn(
        "relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200",
        isAdded
          ? "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer",
      )}
      onClick={() => !isAdded && onAdd(service)}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isAdded
            ? "bg-emerald-100 text-emerald-600"
            : "bg-gray-100 text-gray-400",
        )}
      >
        <Puzzle className="h-5 w-5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {service.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          TZS {service.price.toLocaleString()}
          <span className="text-gray-400"> / month</span>
        </p>
      </div>

      {/* Action */}
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onAdd(service);
        }}
        disabled={isAdded}
        className={cn(
          "shrink-0 h-8 px-3 rounded-lg text-xs font-medium transition-all",
          isAdded
            ? "bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-default"
            : "bg-gray-900 hover:bg-gray-700 text-white",
        )}
      >
        {isAdded ? (
          <>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Added
          </>
        ) : (
          <>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </>
        )}
      </Button>
    </div>
  );
};

export default AdditionalServiceCard;
