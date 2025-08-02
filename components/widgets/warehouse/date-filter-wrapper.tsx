'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { DateFilter } from "./date-filter";

interface DateFilterWrapperProps {
  initialDateFrom?: string;
  initialDateTo?: string;
}

export function DateFilterWrapper({ initialDateFrom, initialDateTo }: DateFilterWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    initialDateFrom ? new Date(initialDateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    initialDateTo ? new Date(initialDateTo) : undefined
  );

  const updateUrlParams = (newDateFrom?: Date, newDateTo?: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newDateFrom) {
      params.set('dateFrom', newDateFrom.toISOString().split('T')[0]);
    } else {
      params.delete('dateFrom');
    }
    
    if (newDateTo) {
      params.set('dateTo', newDateTo.toISOString().split('T')[0]);
    } else {
      params.delete('dateTo');
    }
    
    // Reset to first page when filtering
    params.set('page', '1');
    
    router.push(`?${params.toString()}`);
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    updateUrlParams(date, dateTo);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    updateUrlParams(dateFrom, date);
  };

  const handleClear = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    updateUrlParams(undefined, undefined);
  };

  return (
    <DateFilter
      dateFrom={dateFrom}
      dateTo={dateTo}
      onDateFromChange={handleDateFromChange}
      onDateToChange={handleDateToChange}
      onClear={handleClear}
    />
  );
}