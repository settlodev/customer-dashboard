'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Form, FormField, FormItem } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import SubmitButton from '@/components/widgets/submit-button';
import { toast } from '@/hooks/use-toast';
import Loading from '../../loading';
import { cashFlowReport } from '@/lib/actions/order-actions';
import { CashFlow } from '@/types/orders/type';

interface DatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    label: string;

}

const FormSchema = z.object({
    startDate: z.date({ required_error: "Start date and time are required." }),
    endDate: z.date({ required_error: "End date and time are required." }),
});

const CashFlowReportDashboard = () => {
    const [cashfData, setCashData] = useState<CashFlow | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            startDate: (() => {
                const now = new Date();
                now.setHours(0, 0, 0, 1);
                return now;
            })(),
            endDate: new Date(),
        },
    });

    const fetchCashFlowReport = async (startDate: Date, endDate: Date) => {
        setIsLoading(true);
        try {
            const response = await cashFlowReport(startDate, endDate);
            setCashData(response);
        } catch (error) {
            console.error("Error fetching cash flow report:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch cash flow report",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCashFlowReport(form.getValues('startDate'), form.getValues('endDate'));
    }, []);

    const onSubmit = async (values: z.infer<typeof FormSchema>) => {
        await fetchCashFlowReport(values.startDate, values.endDate);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'TZS', 
        }).format(value);
    };

    const DateTimePicker = ({ value, onChange }: DatePickerProps) => {
        function handleDateSelect(date: Date | undefined) {
            if (date) {
                const newDate = new Date(date);
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
                        {value ? format(value, "MM/dd/yyyy HH:mm") : <span>Pick date and time</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <div className="sm:flex">
                        <Calendar
                            mode="single"
                            selected={value}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                            <ScrollArea className="w-64 sm:w-auto">
                                <div className="flex sm:flex-col p-2">
                                    {Array.from({ length: 24 }, (_, i) => i)
                                        .reverse()
                                        .map((hour) => (
                                            <Button
                                                key={hour}
                                                size="icon"
                                                variant={value && value.getHours() === hour ? "default" : "ghost"}
                                                className="sm:w-full shrink-0 aspect-square"
                                                onClick={() => handleTimeChange("hour", hour.toString())}
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
                                            variant={value && value.getMinutes() === minute ? "default" : "ghost"}
                                            className="sm:w-full shrink-0 aspect-square"
                                            onClick={() => handleTimeChange("minute", minute.toString())}
                                        >
                                            {minute.toString().padStart(2, "0")}
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
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loading />
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen mt-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Cash Flow Report</h1>
                    <p className="text-gray-500 mt-1">
                        Report from {format(new Date(cashfData?.startDate || ''), 'PPp')} 
                        {' to '}
                        {format(new Date(cashfData?.endDate || ''), 'PPp')}
                    </p>
                </div>
                
                <Card className="w-full md:w-auto shadow-sm">
                    <CardContent className="p-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="w-full sm:w-auto">
                                            <DateTimePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                label='Start Date'
                                            />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="w-full sm:w-auto">
                                            <DateTimePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                label='End Date'
                                            />
                                        </FormItem>
                                    )}
                                />
                                
                                <SubmitButton 
                                    isPending={form.formState.isSubmitting} 
                                    label='Apply Filter' 
                                />
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center">
                            <span>Total Transactions</span>
                            <span className="font-bold">{cashfData?.transactions || 0}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span>Total Amount</span>
                            <span className="font-bold text-green-600">
                                {formatCurrency(cashfData?.transactionsAmount || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center">
                            <span>Total Expenses</span>
                            <span className="font-bold">{cashfData?.expenses || 0}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span>Total Amount</span>
                            <span className="font-bold text-red-600">
                                {formatCurrency(cashfData?.expensesAmount || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Refunds</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center">
                            <span>Total Refunds</span>
                            <span className="font-bold">{cashfData?.refunds || 0}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span>Total Amount</span>
                            <span className="font-bold text-orange-600">
                                {formatCurrency(cashfData?.refundsAmount || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {cashfData?.paymentMethodTotals?.map((method, index) => (
                            <div 
                                key={index} 
                                className="flex justify-between items-center border-b pb-2 last:border-b-0"
                            >
                                <span>{method.paymentMethodName}</span>
                                <span className="font-bold">
                                    {formatCurrency(method.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Closing Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-start lg:text-center">
                        {formatCurrency(cashfData?.closingBalance || 0)}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};   

export default CashFlowReportDashboard;