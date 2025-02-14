'use client';

import { getStockVariantMovement } from '@/lib/actions/stock-variant-actions';
import { UUID } from 'crypto';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StockMovementDashboard from '@/components/widgets/stock-movement';
import { StockMovement } from '@/types/stockVariant/type';
import Loading from '@/app/loading';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea} from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar'; // Added this import
import BreadcrumbsNav from '@/components/layouts/breadcrumbs-nav';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}

const DateTimePicker = ({ value, onChange, label }: DatePickerProps) => {
  function handleDateSelect(date: Date | undefined) {
    if (date) {
      const newDate = new Date(date);
      // Preserve the current time when changing the date
      newDate.setHours(value.getHours());
      newDate.setMinutes(value.getMinutes());
      onChange(newDate);
    }
  }

  function handleTimeChange(type: "hour" | "minute", val: string) {
    const newDate = new Date(value);
    if (type === "hour") {
      newDate.setHours(parseInt(val, 10));
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(val, 10));
    }
    onChange(newDate);
  }

  return (
    <div className="flex flex-col space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "MMM do, yyyy HH:mm") : <span>Pick date and time</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="p-2">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleDateSelect}
                initialFocus
              />
            </div>
            <div className="border-l flex flex-row sm:flex-col p-2 sm:h-[300px]">
              <ScrollArea className="w-full h-full">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium pl-2 pb-1">Hours</p>
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <Button
                      key={hour}
                      variant={value.getHours() === hour ? "default" : "ghost"}
                      className="w-full"
                      onClick={() => handleTimeChange("hour", hour.toString())}
                    >
                      {hour.toString().padStart(2, '0')}:00
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <ScrollArea className="w-full h-full">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium pl-2 pb-1">Minutes</p>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      variant={value.getMinutes() === minute ? "default" : "ghost"}
                      className="w-full"
                      onClick={() => handleTimeChange("minute", minute.toString())}
                    >
                      :{minute.toString().padStart(2, '0')}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};


export default function StockVariantDetails({ params }: { params: { id: string } }) {
  const [variant, setVariant] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [endDate, setEndDate] = useState(new Date());
  const breadCrumbItems = [{title: "Stock Items", link: "/stock-variants"},
    {title: `${variant[0]?.stockName}-${variant[0]?.stockVariantName}`, link: ""}];

  useEffect(() => {
    const fetchStockVariantDetail = async () => {
      try {
        const data = await getStockVariantMovement(params.id as UUID);
        setVariant(data);
        setFilteredMovements(data);
      } catch (error) {
        console.error("Error fetching stock movement history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockVariantDetail();
  }, [params.id]);

  const handleFilter = () => {
    const filtered = variant.filter((movement) => {
      const movementDate = new Date(movement.dateCreated);
      return movementDate >= startDate && movementDate <= endDate;
    });
    setFilteredMovements(filtered);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
    <BreadcrumbsNav items={breadCrumbItems} />
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className='flex flex-col lg:flex-row justify-between'>
              <p>
                <span className='font-bold text-black-2 text-xlg'>
                  {variant[0]?.stockName}-{variant[0]?.stockVariantName}
                </span>
              </p>
              <div className='grid grid-cols-2 lg:flex items-center gap-2'>
                <DateTimePicker label="From" value={startDate} onChange={setStartDate} />
                <DateTimePicker label="To" value={endDate} onChange={setEndDate} />
                <Button variant="default" className='ml-4 w-full' onClick={handleFilter}>
                  Filter
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <StockMovementDashboard movements={filteredMovements} />
    </div>
  );
}