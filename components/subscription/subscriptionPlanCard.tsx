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
import { Subscriptions } from "@/types/subscription/type";
import { cn } from "@/lib/utils";

interface SubscriptionPlanCardProps {
  plan: Subscriptions;
  isSelected: boolean;
  isCurrent: boolean;
  actionType: "upgrade" | "downgrade" | "renew" | "switch" | "subscribe";
  onSelect: (plan: Subscriptions) => void;
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

const isDiamond = (name: string) => name?.toLowerCase().includes("diamond");

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  isSelected,
  isCurrent,
  actionType,
  onSelect,
}) => {
  const annualAmount = plan.amount * 12;
  const config = ACTION_CONFIG[actionType];
  const diamond = isDiamond(plan.packageName);

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
          {plan.packageName}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">
            TZS {annualAmount.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400 font-normal">/year</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          TZS {plan.amount.toLocaleString()} / month
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mb-4" />

      {/* Features */}
      <ul className="flex-1 space-y-2 mb-5">
        {plan.subscriptionFeatures.slice(0, 5).map((feature) => (
          <li
            key={feature.id}
            className="flex items-start gap-2 text-sm text-gray-600"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>{feature.name}</span>
          </li>
        ))}
        {plan.subscriptionFeatures.length > 5 && (
          <li className="text-xs text-gray-400 pl-5">
            +{plan.subscriptionFeatures.length - 5} more features
          </li>
        )}
      </ul>

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
