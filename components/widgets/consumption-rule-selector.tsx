"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getConsumptionRules } from "@/lib/actions/consumption-rule-actions";
import type { ConsumptionRule } from "@/types/consumption-rule/type";

interface ConsumptionRuleSelectorProps {
  placeholder?: string;
  value?: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  RECIPE: "Recipe",
  BUNDLE: "Bundle",
  COMBO: "Combo",
  MODIFIER: "Modifier",
  MANUFACTURING: "Manufacturing",
  KIT: "Kit",
};

export default function ConsumptionRuleSelector({
  placeholder = "Select consumption rule",
  value,
  isDisabled,
  onChange,
  onBlur,
}: ConsumptionRuleSelectorProps) {
  const [rules, setRules] = useState<ConsumptionRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await getConsumptionRules();
        setRules(data);
      } catch {
        setRules([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={isDisabled || isLoading}
      onOpenChange={onBlur}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {rules.length > 0 ? (
          rules.map((rule) => (
            <SelectItem key={rule.id} value={rule.id}>
              <div className="flex items-center gap-2">
                <span>{rule.name}</span>
                <span className="text-xs text-muted-foreground">
                  {TYPE_LABELS[rule.consumptionType] || rule.consumptionType}
                </span>
              </div>
            </SelectItem>
          ))
        ) : (
          <div className="py-2 px-3 text-sm text-muted-foreground">
            {isLoading ? "Loading..." : "No consumption rules found"}
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
