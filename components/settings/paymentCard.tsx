import {
  Banknote,
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { useState } from "react";

export const PaymentMethodCard = ({
  category,
  selectedMethods,
  onMethodToggle,
  onCategoryToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = (name: any) => {
    switch (name.toLowerCase()) {
      case "mobile money":
        return <Smartphone className="w-6 h-6" />;
      case "card":
        return <CreditCard className="w-6 h-6" />;
      case "bank":
        return <Building2 className="w-6 h-6" />;
      case "cash":
        return <Banknote className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getColorClass = (name: any) => {
    switch (name.toLowerCase()) {
      case "mobile money":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "card":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "bank":
        return "bg-green-50 border-green-200 text-green-700";
      case "cash":
        return "bg-amber-50 border-amber-200 text-amber-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const enabledMethods = category.acceptedPaymentMethodTypes.filter(
    (m: any) => m.isEnabled,
  );

  const allSelected = enabledMethods.every((method: any) =>
    selectedMethods.includes(method.id),
  );
  const someSelected =
    enabledMethods.some((method: any) => selectedMethods.includes(method.id)) &&
    !allSelected;

  const handleCategoryCheckbox = (e: any) => {
    e.stopPropagation();
    onCategoryToggle(category.id, enabledMethods, !allSelected);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div
            onClick={handleCategoryCheckbox}
            className="relative flex items-center justify-center"
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => {}}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              style={{
                accentColor: someSelected ? "#3b82f6" : undefined,
                opacity: someSelected ? 0.5 : 1,
              }}
            />
          </div>
          <div className={`p-3 rounded-lg ${getColorClass(category.name)}`}>
            {getIcon(category.name)}
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">
              {category.name}
            </h3>
            <p className="text-sm text-gray-500">
              {enabledMethods.length} payment{" "}
              {enabledMethods.length === 1 ? "method" : "methods"} available
            </p>
          </div>
        </div>
        <div className="text-gray-400">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {enabledMethods.map((method: any) => (
              <div
                key={method.id}
                onClick={() => onMethodToggle(method.id)}
                className="flex items-center gap-3 p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedMethods.includes(method.id)}
                  onChange={() => {}}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700 font-medium">
                  {method.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
