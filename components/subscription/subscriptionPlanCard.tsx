import React from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { Package } from "@/types/billing/types";
import { cn } from "@/lib/utils";

interface SubscriptionPlanCardProps {
  plan: Package;
  isSelected: boolean;
  isCurrent: boolean;
  actionType: "upgrade" | "downgrade" | "renew" | "switch" | "subscribe";
  onSelect: (plan: Package) => void;
}

const ACTION_CONFIG = {
  upgrade: {
    label: "Upgrade Plan",
    icon: ArrowUp,
    className: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  downgrade: {
    label: "Downgrade",
    icon: ArrowDown,
    className: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  renew: {
    label: "Renew Plan",
    icon: RotateCcw,
    className: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  switch: {
    label: "Switch Plan",
    icon: ArrowRight,
    className: "bg-slate-700 hover:bg-slate-800 text-white",
  },
  subscribe: {
    label: "Select Plan",
    icon: Plus,
    className: "bg-slate-700 hover:bg-slate-800 text-white",
  },
};

const isPremium = (name: string) => name?.toLowerCase().includes("diamond") || name?.toLowerCase().includes("premium");

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  isSelected,
  isCurrent,
  actionType,
  onSelect,
}) => {
  const annualAmount = plan.basePrice * 12;
  const config = ACTION_CONFIG[actionType];
  const diamond = isPremium(plan.name);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-5 transition-all duration-200 cursor-pointer group",
        isSelected
          ? "border-emerald-400 bg-emerald-50/60 shadow-md ring-1 ring-emerald-300"
          : diamond
            ? "border-violet-200 bg-gradient-to-b from-violet-50/80 to-white hover:border-violet-300 hover:shadow-md"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
      )}
      onClick={() => !isSelected && onSelect(plan)}
    >
      {/* Badges */}
      <div className="absolute -top-3 right-4 flex gap-1.5">
        {isCurrent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
            Current
          </span>
        )}
        {diamond && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            <Sparkles className="h-2.5 w-2.5" />
            Premium
          </span>
        )}
      </div>

      {/* Plan name + price */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {plan.name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">
            TZS {annualAmount.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400 font-normal">/year</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          TZS {plan.basePrice.toLocaleString()} / month
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mb-4" />

      {/* Description */}
      {plan.description && (
        <p className="text-xs text-gray-500 mb-4">{plan.description}</p>
      )}

      {/* CTA */}
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(plan);
        }}
        disabled={isSelected}
        className={cn(
          "w-full h-9 text-sm font-medium rounded-xl transition-all",
          isSelected
            ? "bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-default"
            : config.className,
        )}
      >
        {isSelected ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Selected
          </>
        ) : (
          <>
            <config.icon className="h-3.5 w-3.5 mr-1.5" />
            {config.label}
          </>
        )}
      </Button>
    </div>
  );
};

export default SubscriptionPlanCard;
