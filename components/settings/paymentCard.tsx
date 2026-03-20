import {
  Banknote,
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Loader2,
  Smartphone,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { PaymentMethod } from "@/types/payments/type";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  enabledIds: Set<string>;
  toggling: string | null;
  onToggle: (methodId: string, enabled: boolean) => void;
}

export const PaymentMethodCard = ({
  method,
  enabledIds,
  toggling,
  onToggle,
}: PaymentMethodCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = method.children && method.children.length > 0;
  const isEnabled = enabledIds.has(method.id);
  const isToggling = toggling === method.id;

  const getIcon = (code: string) => {
    switch (code) {
      case "MOBILE_MONEY":
        return <Smartphone className="w-5 h-5" />;
      case "CARD":
        return <CreditCard className="w-5 h-5" />;
      case "BANK":
        return <Building2 className="w-5 h-5" />;
      case "CASH":
        return <Banknote className="w-5 h-5" />;
      case "PAYMENT_AGGREGATORS":
        return <Zap className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getColorClass = (code: string) => {
    switch (code) {
      case "MOBILE_MONEY":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "CARD":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "BANK":
        return "bg-green-50 border-green-200 text-green-700";
      case "CASH":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "PAYMENT_AGGREGATORS":
        return "bg-indigo-50 border-indigo-200 text-indigo-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Parent row */}
      <div className="p-5 flex items-center justify-between">
        <div
          className="flex items-center gap-4 flex-1 cursor-pointer"
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          <div className={`p-2.5 rounded-lg ${getColorClass(method.code)}`}>
            {getIcon(method.code)}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {method.displayName}
            </h3>
            <p className="text-xs text-gray-500">
              {hasChildren
                ? `${method.children!.length} ${method.children!.length === 1 ? "method" : "methods"}`
                : method.code}
              {method.integrationCapable && (
                <span className="ml-2 inline-flex items-center gap-0.5 text-indigo-600">
                  <Zap className="w-3 h-3" /> Integration
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isToggling ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => onToggle(method.id, checked)}
            />
          )}
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {method.children!
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((child) => {
                const childEnabled = enabledIds.has(child.id);
                const childToggling = toggling === child.id;

                return (
                  <div
                    key={child.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      childEnabled
                        ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {child.displayName}
                      </span>
                      {child.integrationCapable && (
                        <span className="text-indigo-500">
                          <Zap className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    {childToggling ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <Switch
                        checked={childEnabled}
                        disabled={!isEnabled}
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
