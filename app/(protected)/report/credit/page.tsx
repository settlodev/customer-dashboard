
'use client';
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Download} from 'lucide-react';
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
import { creditReport } from '@/lib/actions/order-actions';
import { Credit } from '@/types/orders/type';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface DatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    label: string;
}

const FormSchema = z.object({
    startDate: z.date({ required_error: "Start date and time are required." }),
    endDate: z.date({ required_error: "End date and time are required." }),
});

const CreditReportDashboard = () => {
    const [creditData, setCreditData] = useState<Credit | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

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

    const fetchCreditReport = async (startDate: Date, endDate: Date) => {
        setIsLoading(true);
        try {
            const response = await creditReport(startDate, endDate);
            setCreditData(response);
            
            // Calculate total unpaid amount

        } catch (error) {
            console.error("Error fetching credit report:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch credit report",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCreditReport(form.getValues('startDate'), form.getValues('endDate'));
    }, []);

    const onSubmit = async (values: z.infer<typeof FormSchema>) => {
        await fetchCreditReport(values.startDate, values.endDate);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'TZS', 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const exportToCsv = () => {
        if (!creditData || !creditData.unpaidOrders) return;
        
        const headers = ["Order ID", "Order Number", "Date", "Paid", "Unpaid", "Customer"];
        const rows = creditData.unpaidOrders.map(order => [
            order.orderId,
            order.orderNumber,
            format(new Date(order.openedDate), 'PPp'),
            formatCurrency(order.paidAmount),
            formatCurrency(order.unpaidAmount),
            order.customerName || 'N/A'
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `credit-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const DateTimePicker = ({ value, onChange}: DatePickerProps) => {
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
                    <h1 className="text-2xl font-bold text-gray-800">Credit Report</h1>
                    <p className="text-gray-500 mt-1">
                        Report from {creditData && format(new Date(creditData.startDate), 'PPp')} 
                        {' to '}
                        {creditData && format(new Date(creditData.endDate), 'PPp')}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

            <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-gray-700">
                        Total unpaid orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">
                            {creditData?.total || 0}
                        </div>
                       
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-gray-700">
                            Total Unpaid Amount
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">
                            {formatCurrency(creditData?.totalUnpaidAmount || 0)}
                        </div>
                       
                    </CardContent>
                </Card>
                
              
                
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-gray-700">
                            Total Paid Amount
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">
                            {formatCurrency(creditData?.totalPaidAmount || 0)}
                        </div>
                        
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Unpaid Orders</h2>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportToCsv}
                    className="flex items-center gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export Report
                </Button>
            </div>
            
            <Card className="shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order Number</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead className="text-right">Paid Amount</TableHead>
                                <TableHead className="text-right">Unpaid Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {creditData?.unpaidOrders && creditData.unpaidOrders.length > 0 ? (
                                creditData.unpaidOrders.map((order) => (
                                    <TableRow key={order.orderId}
                                    onClick={() => router.push(`/orders/${order.orderId}`)}
                                    className="cursor-pointer hover:bg-muted">
                                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                        <TableCell>{format(new Date(order.openedDate), 'PP')}</TableCell>
                                        <TableCell>{order.customerName || 'N/A'}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(order.paidAmount)}</TableCell>
                                        <TableCell className="text-right font-medium text-red-600">
                                            {formatCurrency(order.unpaidAmount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                Unpaid
                                            </Badge>
                                        </TableCell>
    
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No unpaid orders found for the selected time period
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};   

export default CreditReportDashboard;