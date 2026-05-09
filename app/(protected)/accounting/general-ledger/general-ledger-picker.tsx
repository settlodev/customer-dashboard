"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";

interface Props {
  defaultAccountId: string;
  defaultStartDate: string;
  defaultEndDate: string;
}

export function GeneralLedgerPicker({
  defaultAccountId,
  defaultStartDate,
  defaultEndDate,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const apply = () => {
    const sp = new URLSearchParams(searchParams.toString());
    if (accountId) sp.set("accountId", accountId);
    else sp.delete("accountId");
    sp.set("startDate", startDate);
    sp.set("endDate", endDate);
    router.push(`?${sp.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
      <div className="sm:col-span-6">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Account
        </label>
        <ChartOfAccountSelector
          value={accountId}
          onChange={(v) => setAccountId(v)}
        />
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          From
        </label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          To
        </label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <div className="sm:col-span-1 flex items-end">
        <Button onClick={apply} className="w-full">
          Apply
        </Button>
      </div>
    </div>
  );
}
