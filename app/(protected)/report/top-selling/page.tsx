'use client';
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { topSellingProduct } from '@/lib/actions/product-actions';
import { Input } from '@/components/ui/input';
import { TopItems, TopSellingProduct } from '@/types/product/type';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Loading from '@/components/ui/loading';

function DateTimePicker({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      const newDate = new Date(selected);
      newDate.setHours(value.getHours());
      newDate.setMinutes(value.getMinutes());
      onChange(newDate);
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
    const newDate = new Date(value);
    if (type === 'hour') {
      newDate.setHours(parseInt(val, 10));
    } else {
      newDate.setMinutes(parseInt(val, 10));
    }
    onChange(newDate);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="hidden mr-2 h-4 w-4" />
          {format(value, 'MM/dd/yyyy HH:mm')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          <Calendar mode="single" selected={value} onSelect={handleDateSelect} initialFocus />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={value.getHours() === hour ? 'default' : 'ghost'}
                    onClick={() => handleTimeChange('hour', hour.toString())}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={value.getMinutes() === minute ? 'default' : 'ghost'}
                    onClick={() => handleTimeChange('minute', minute.toString())}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const TopSellingPage = () => {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  });
  const [endDate, setEndDate] = useState(new Date());
  const [limit, setLimit] = useState(10);
  const [soldData, setSoldData] = useState<TopSellingProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await topSellingProduct(startDate, endDate, limit);
        setSoldData(response);
      } catch (error) {
        console.error('Error fetching top selling products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilter = async () => {
    setIsFiltering(true);
    try {
      const response = await topSellingProduct(startDate, endDate, limit);
      setSoldData(response);
    } catch (error) {
      console.error('Error fetching top selling products:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat().format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 space-y-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Top selling products
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Most popular products by revenue
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <DateTimePicker value={startDate} onChange={setStartDate} />
          <DateTimePicker value={endDate} onChange={setEndDate} />
          <Input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full sm:w-20"
            min={1}
            placeholder="Limit"
          />
          <Button onClick={handleFilter} disabled={isFiltering}>
            {isFiltering ? (
              <div className="border-t-transparent border-4 border-green-500 w-[20px] h-[20px] rounded-full animate-spin" />
            ) : (
              'Filter'
            )}
          </Button>
        </div>
      </div>

      {/* Results table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Top {soldData?.items?.length || 0} products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">% of total</TableHead>
                <TableHead className="text-right">Latest sold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {soldData?.items?.length ? (
                soldData.items.map((item: TopItems, index: number) => (
                  <TableRow key={`${item.productName}-${item.variantName}-${index}`}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {item.productName}{item.variantName ? ` - ${item.variantName}` : ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.categoryName}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.quantity)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.revenue)} TZS</TableCell>
                    <TableCell className="text-right font-medium">{item.percentageOfTotal}%</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {format(new Date(item.latestSoldDate), 'dd MMM HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No data available for the selected period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopSellingPage;
