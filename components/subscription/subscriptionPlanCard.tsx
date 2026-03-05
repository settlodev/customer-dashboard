import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Subscriptions } from "@/types/subscription/type";

interface SubscriptionPlanCardProps {
  plan: Subscriptions;
  isSelected: boolean;
  isCurrent: boolean;
  actionType: "upgrade" | "downgrade" | "renew" | "switch" | "subscribe";
  onSelect: (plan: Subscriptions) => void;
}

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  isSelected,
  isCurrent,
  actionType,
  onSelect,
}) => {
  const annualAmount = plan.amount * 12;

  const formattedAnnualAmount = annualAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const getActionLabel = () => {
    const labels = {
      renew: "Renew Plan",
      upgrade: "Upgrade",
      downgrade: "Downgrade",
      switch: "Switch Plan",
      subscribe: "Select Plan",
    };
    return labels[actionType] || "Select Plan";
  };

  const getActionIcon = () => {
    const icons = {
      upgrade: <ArrowUp className="w-4 h-4 mr-1" />,
      downgrade: <ArrowDown className="w-4 h-4 mr-1" />,
      renew: <RotateCcw className="w-4 h-4 mr-1" />,
      switch: <ArrowRight className="w-4 h-4 mr-1" />,
      subscribe: <Plus className="w-4 h-4 mr-1" />,
    };
    return icons[actionType] || icons.subscribe;
  };

  const getButtonColor = () => {
    switch (actionType) {
      case "upgrade":
        return "bg-blue-500 hover:bg-blue-600";
      case "downgrade":
        return "bg-orange-500 hover:bg-orange-600";
      case "renew":
        return "bg-emerald-500 hover:bg-emerald-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <Card
      className={`hover:shadow-lg transform transition-all duration-300 cursor-pointer relative
        ${
          isSelected
            ? "border-2 border-emerald-500 shadow-md scale-[1.02]"
            : "border border-gray-200 hover:border-gray-300"
        }`}
    >
      {isCurrent && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
          Current
        </div>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{plan.packageName}</CardTitle>
        <div className="space-y-1">
          <div className="text-xl font-bold">
            {formattedAnnualAmount}
            <span className="text-sm text-gray-500 font-normal">/year</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ul className="space-y-2 mb-4">
          {plan.subscriptionFeatures.slice(0, 5).map((feature) => (
            <li key={feature.id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {feature.name}
            </li>
          ))}
          {plan.subscriptionFeatures.length > 5 && (
            <li className="text-xs text-gray-600 italic pl-6">
              +{plan.subscriptionFeatures.length - 5} more features
            </li>
          )}
        </ul>

        <Button
          size="sm"
          onClick={() => onSelect(plan)}
          className={`w-full ${getButtonColor()}`}
          disabled={isSelected}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Selected
            </>
          ) : (
            <>
              {getActionIcon()}
              {getActionLabel()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubscriptionPlanCard;
