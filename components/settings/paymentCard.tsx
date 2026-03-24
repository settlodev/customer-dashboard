import {
  Banknote,
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Info,
  Loader2,
  Smartphone,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { PaymentMethod } from "@/types/payments/type";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  toggling: string | null;
  onToggle: (methodId: string, enabled: boolean) => void;
}

export const PaymentMethodCard = ({
  method,
  toggling,
  onToggle,
}: PaymentMethodCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = method.children && method.children.length > 0;
  const isToggling = toggling === method.id;
  const anyChildEnabled = hasChildren && method.children!.some((c) => c.enabled);

  const getIcon = (code: string) => {
    switch (code) {
      case "MOBILE_MONEY":
        return <Smartphone className="w-4 h-4" />;
      case "CARD":
        return <CreditCard className="w-4 h-4" />;
      case "BANK":
        return <Building2 className="w-4 h-4" />;
      case "CASH":
        return <Banknote className="w-4 h-4" />;
      case "PAYMENT_AGGREGATORS":
        return <Zap className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    if (!hasChildren) return method.enabled ? "Enabled" : "Disabled";
    if (method.enabled) return `All ${method.displayName.toLowerCase()} types accepted`;
    if (anyChildEnabled) {
      const enabledChildren = method.children!.filter((c) => c.enabled);
      return enabledChildren.map((c) => c.displayName).join(", ");
    }
    return "Disabled";
  };

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      {/* Parent row */}
      <div className="py-4 px-1 flex items-center justify-between">
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          <span className="text-gray-400 dark:text-gray-500">
            {getIcon(method.code)}
          </span>
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {method.displayName}
            </span>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {getStatusText()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isToggling ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <Switch
              checked={method.enabled}
              onCheckedChange={(checked) => onToggle(method.id, checked)}
            />
          )}
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 p-0.5"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="pb-4 pl-8 pr-1">
          {/* Info message */}
          <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400 dark:text-gray-500">
            <Info className="w-3 h-3 flex-shrink-0" />
            {method.enabled ? (
              <span>All types accepted. Toggle individually to be specific.</span>
            ) : anyChildEnabled ? (
              <span>Only selected types accepted.</span>
            ) : (
              <span>No types enabled.</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {method.children!
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((child) => {
                const childToggling = toggling === child.id;

                return (
                  <div
                    key={child.id}
                    className={`flex items-center justify-between py-2.5 px-3 rounded-md border border-gray-100 dark:border-gray-800 ${
                      method.enabled ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {child.displayName}
                      </span>
                      {child.integrationCapable && (
                        <Zap className="w-3 h-3 text-indigo-400" />
                      )}
                    </div>
                    {method.enabled ? (
                      <span className="text-xs text-gray-400">Included</span>
                    ) : childToggling ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <Switch
                        checked={child.enabled}
                        onCheckedChange={(checked) => onToggle(child.id, checked)}
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
