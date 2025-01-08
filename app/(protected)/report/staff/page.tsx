'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, DollarSign, Package, Search, ShoppingCart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Form, FormField, FormItem } from '@/components/ui/form';
import { z } from 'zod';
import { FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import SubmitButton from '@/components/widgets/submit-button';
import { toast } from '@/hooks/use-toast';
import Loading from '../../loading';
import { staffReport } from '@/lib/actions/staff-actions';
import { StaffSummaryReport } from '@/types/staff';

interface DatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    label: string;

}

const FormSchema = z.object({
    startDate: z.date({ required_error: "Start date and time are required." }),
    endDate: z.date({ required_error: "End date and time are required." }),
    limit: z.number().optional(),
});

const StaffReportDashboard = () => {
    const [startDate] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const [endDate] = useState(new Date());
    const [staffData, setStaffData] = useState<StaffSummaryReport | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchingStaffReport = async () => {
            try {
                const response = await staffReport(startDate, endDate);
                setStaffData(response);
            } catch (error) {
                console.error("Error fetching staff summary report:", error);
            }
            finally {
                setIsLoading(false);
            }
        };

        fetchingStaffReport();
    }, []);

    const form = useForm<z.infer<typeof FormSchema>>({
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

    const onInvalid = useCallback(
        (errors: FieldErrors) => {
            console.log("Errors during form submission:", errors);
            toast({
                variant: "destructive",
                title: "Uh oh! something went wrong",
                description: typeof errors.message === 'string' && errors.message
                    ? errors.message
                    : "There was an issue submitting your form, please try later",
            });
        },
        [toast]
    );

    const onSubmit = async (values: z.infer<typeof FormSchema>) => {
        try {
            const response = await staffReport(values.startDate, values.endDate);
            console.log("The staff report with filter is: ", response);
            setStaffData(response);
        } catch (error) {
            console.error("Error fetching staff summary report:", error);
        }
        finally {
            setIsLoading(false);
        }
    };



    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat().format(value) || 0;
    };

    const DateTimePicker = ({ value, onChange, label }: DatePickerProps) => {
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
            </div>
        );
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

    const totals = staffData?.staffReports.reduce((acc, staff) => ({
        orders: acc.orders + staff.totalOrdersCompleted,
        items: acc.items + staff.totalItemsSold,
        intakes: acc.intakes + staff.totalStockIntakePerformed,
        gross: acc.gross + staff.totalGrossAmount,
        net: acc.net + staff.totalNetAmount,
        profit: acc.profit + staff.totalGrossProfit
    }), { orders: 0, items: 0, intakes: 0, gross: 0, net: 0, profit: 0 });

    const filteredStaff = staffData?.staffReports.filter(staff =>
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.totalOrdersCompleted?.toString().includes(searchQuery) || false) ||
        (staff.totalItemsSold?.toString().includes(searchQuery) || false) ||
        (staff.totalStockIntakePerformed?.toString().includes(searchQuery) || false) ||
        (staff.totalGrossAmount?.toString().includes(searchQuery) || false)
    );

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Staff Performance Report </h1>
            </div>
            <div className="flex flex-col-reverse  lg:flex-row gap-8">
               
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <ShoppingCart className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Orders</p>
                                        <h3 className="text-2xl font-bold">{totals?.orders}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-green-100 rounded-full">
                                        <Package className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Items Sold</p>
                                        <h3 className="text-2xl font-bold">{totals?.items}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-purple-100 rounded-full">
                                        <Users className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Stock Intakes</p>
                                        <h3 className="text-2xl font-bold">{totals?.intakes ? totals?.intakes : 0}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-yellow-100 rounded-full">
                                        <DollarSign className="h-6 w-6 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Gross Amount</p>
                                        <h3 className="text-xl font-bold">{formatCurrency(totals?.gross ?? 0)}/=</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-yellow-100 rounded-full">
                                        <DollarSign className="h-6 w-6 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Net Amount</p>
                                        <h3 className="text-xl font-bold">{formatCurrency(totals?.net ?? 0)}/=</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-yellow-100 rounded-full">
                                        <DollarSign className="h-6 w-6 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Gross Profit</p>
                                        <h3 className="text-xl font-bold">{formatCurrency(totals?.profit ?? 0)}/=</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
            
                <div className=''>
                    <Card >
                        <CardHeader>
                            <CardTitle className='text-[14px] font-medium'>Filter Report by Date & Time</CardTitle>
                        </CardHeader>
                        <CardContent >
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
                                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                        <FormField
                                            control={form.control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <DateTimePicker
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        label="Start Date"
                                                    />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="endDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <DateTimePicker
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        label="End Date"
                                                    />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className='grid grid-cols-1 w-full gap-4 mt-4'>
                                        <SubmitButton isPending={form.formState.isSubmitting} label='Filter Report' />
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className='text-lg font-medium'>Staff Performance Details</CardTitle>
                    <div className="relative mt-4">
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-4 text-left">Name</th>
                                    <th className="p-4 text-right">Orders</th>
                                    <th className="p-4 text-right">Items Sold</th>
                                    <th className="p-4 text-right">Stock Intakes</th>
                                    <th className="p-4 text-right">Gross Amount</th>
                                    <th className="p-4 text-right">Net Amount</th>
                                    <th className="p-4 text-right">Gross Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff && filteredStaff.length > 0 ? (
                                    filteredStaff.map((staff) => (
                                        <tr key={staff.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4">{staff.name}</td>
                                            <td className="p-4 text-right">{staff.totalOrdersCompleted}</td>
                                            <td className="p-4 text-right">{staff.totalItemsSold}</td>
                                            <td className="p-4 text-right">{staff.totalStockIntakePerformed ? staff.totalStockIntakePerformed : 0}</td>
                                            <td className="p-4 text-right">{formatCurrency(staff.totalGrossAmount)}</td>
                                            <td className="p-4 text-right">{formatCurrency(staff.totalNetAmount)}</td>
                                            <td className="p-4 text-right">{formatCurrency(staff.totalGrossProfit)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-4 text-center text-gray-500">
                                            No staff members found matching your search criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StaffReportDashboard;




