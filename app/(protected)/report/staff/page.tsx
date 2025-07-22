'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Award,BarChart3, CalendarIcon,DollarSign, Package, Search, ShoppingCart, TrendingUp, UserCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Form, FormField, FormItem } from '@/components/ui/form';
import { z } from 'zod';
import {useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import SubmitButton from '@/components/widgets/submit-button';
import { toast } from '@/hooks/use-toast';
import Loading from '../../loading';
import { staffReport } from '@/lib/actions/staff-actions';
import { StaffSummaryReport } from '@/types/staff';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    const [activeTab, setActiveTab] = useState('overview');

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
    }, [endDate, startDate]);

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

    const onInvalid = useCallback(
        (errors:any) => {
            console.log("Errors during form submission:", errors);
            toast({
                variant: "destructive",
                title: "Uh oh! something went wrong",
                description: typeof errors.message === 'string' && errors.message
                    ? errors.message
                    : "There was an issue submitting your form, please try later",
            });
        },
        []
    );

    const onSubmit = async (values: z.infer<typeof FormSchema>) => {
        setIsLoading(true);
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

    const formatCurrency = (value:number) => {
        return new Intl.NumberFormat().format(value) || 0;
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
            <div className="flex flex-col space-y-2">
                {/* <span className="text-sm font-medium">{label}</span> */}
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

    // Get top performer
    const topPerformer = staffData?.staffReports?.length 
        ? staffData.staffReports.sort((a, b) => b.totalGrossProfit - a.totalGrossProfit)[0]
        : null;

    // const dateRangeText = `${format(form.getValues().startDate, "MMM dd")} - ${format(form.getValues().endDate, "MMM dd, yyyy")}`;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header section with title and date filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-4 mt-12">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Staff Performance Dashboard</h1>
                    <p className="text-gray-500 mt-1">Track performance metrics and team productivity</p>
                </div>
                
                <Card className="w-full md:w-auto shadow-sm">
                    <CardContent className="p-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col sm:flex-row gap-4">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="w-full sm:w-auto">
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
                                        <FormItem className="w-full sm:w-auto">
                                            <DateTimePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                label="End Date"
                                            />
                                        </FormItem>
                                    )}
                                />
                                
                                <SubmitButton 
                                    isPending={form.formState.isSubmitting} 
                                    label='Apply Filter' 
                                    // className="h-10 mt-auto bg-indigo-600 hover:bg-indigo-700"
                                />
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            {/* Tab navigation */}
            <Tabs defaultValue="overview" className="w-full mb-6" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4  bg-white shadow-sm border">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-800">Overview</TabsTrigger>
                    <TabsTrigger value="staff" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-800">Staff Details</TabsTrigger>
                    {/* <TabsTrigger value="financial" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-800">Financial</TabsTrigger> */}
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Stats summary card */}
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="overflow-hidden transition-all hover:shadow-md bg-blue-50">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-3xl font-bold text-gray-800">{totals?.orders || 0}</h3>
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <ShoppingCart className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden transition-all hover:shadow-md bg-green-50">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Items Sold</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-3xl font-bold text-gray-800">{totals?.items || 0}</h3>
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <Package className="h-5 w-5 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden transition-all hover:shadow-md bg-purple-50">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Stock Intakes</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-3xl font-bold text-gray-800">{totals?.intakes || 0}</h3>
                                        <div className="p-2 bg-purple-100 rounded-full">
                                            <Users className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden transition-all hover:shadow-md bg-white md:col-span-3">
                                <CardHeader className="p-4 pb-2 border-b border-gray-100">
                                    <CardTitle className="text-sm font-medium text-gray-500">Financial Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-3">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-3 rounded-lg bg-gray-50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-medium text-gray-500">Gross Amount</span>
                                                <DollarSign className="h-4 w-4 text-yellow-600" />
                                            </div>
                                            <p className="text-xs lg:text-lg font-semibold">{formatCurrency(totals?.gross ?? 0)}/=</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-gray-50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-medium text-gray-500">Net Amount</span>
                                                <DollarSign className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <p className=" text-xs lg:text-lg font-semibold">{formatCurrency(totals?.net ?? 0)}/=</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-green-50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-medium text-gray-500">Gross Profit</span>
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                            </div>
                                            <p className="text-xs lg:text-lg font-semibold text-green-600">{formatCurrency(totals?.profit ?? 0)}/=</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top performer card */}
                        {topPerformer && (
                            <Card className="overflow-hidden transition-all hover:shadow-md bg-gradient-to-br from-indigo-50 to-white">
                                <CardHeader className="p-4 border-b border-indigo-100/30">
                                    <div className="flex justify-between">
                                        <CardTitle className="text-sm font-medium text-indigo-600">Top Performer</CardTitle>
                                        <Award className="h-5 w-5 text-indigo-600" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-indigo-100 rounded-full">
                                            <UserCircle className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{topPerformer.name}</h3>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center py-2 border-b border-indigo-100/30">
                                            <span className="text-sm text-gray-500">Orders</span>
                                            <span className="font-medium">{topPerformer.totalOrdersCompleted}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-indigo-100/30">
                                            <span className="text-sm text-gray-500">Items Sold</span>
                                            <span className="font-medium">{topPerformer.totalItemsSold}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-indigo-100/30">
                                            <span className="text-sm text-gray-500">Gross Amount</span>
                                            <span className="font-medium">{formatCurrency(topPerformer.totalGrossAmount)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button variant="outline" className="w-full border-indigo-200 hover:bg-indigo-100 text-indigo-600" onClick={() => {
                                        setSearchQuery(topPerformer.name);
                                        setActiveTab('staff');
                                    }}>
                                        View Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>

                    {/* Staff table preview */}
                    <Card className="overflow-hidden shadow-sm bg-white">
                        <CardHeader className="p-4 border-b border-gray-100">
                            <div className="flex justify-between">
                                <div>
                                    <CardTitle className="text-lg font-medium">Recent Staff Performance</CardTitle>
                                    <CardDescription>Top 5 staff members by sales performance</CardDescription>
                                </div>
                                <Button variant="outline" className="text-sm h-9" onClick={() => setActiveTab('staff')}>
                                    View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                                            <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                                            <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStaff && filteredStaff.slice(0, 5).map((staff) => (
                                            <tr key={staff.id} className="border-t border-gray-100 hover:bg-gray-50">
                                                <td className="p-3 font-medium">{staff.name}</td>
                                                <td className="p-3 text-right">{staff.totalOrdersCompleted}</td>
                                                <td className="p-3 text-right">{staff.totalItemsSold}</td>
                                                <td className="p-3 text-right">{formatCurrency(staff.totalGrossAmount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="staff" className="space-y-6">
                    <Card className="overflow-hidden shadow-sm bg-white">
                        <CardHeader className="p-4 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle className="text-lg font-medium">Staff Performance Details</CardTitle>
                                    <CardDescription>Complete breakdown by team member</CardDescription>
                                </div>
                                
                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        placeholder="Search staff..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                                    />
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    {searchQuery && (
                                        <Button 
                                            variant="ghost" 
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 rounded-full"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            ×
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                                            <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Items Sold</th>
                                            <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Intakes</th>
                                            <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Amount</th>
                                            <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Net Amount</th>
                                            <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStaff && filteredStaff.length > 0 ? (
                                            filteredStaff.map((staff) => (
                                                <tr key={staff.id} className="border-t border-gray-100 hover:bg-gray-50">
                                                    <td className="p-3 font-medium">{staff.name}</td>
                                                    <td className="p-3 text-right">{staff.totalOrdersCompleted}</td>
                                                    <td className="p-3 text-right">{staff.totalItemsSold}</td>
                                                    <td className="p-3 text-right">{staff.totalStockIntakePerformed || 0}</td>
                                                    <td className="p-3 text-right">{formatCurrency(staff.totalGrossAmount)}</td>
                                                    <td className="p-3 text-right">{formatCurrency(staff.totalNetAmount)}</td>
                                                    <td className="p-3 text-right text-green-600 font-medium">{formatCurrency(staff.totalGrossProfit)}</td>
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
                </TabsContent>
                
                <TabsContent value="financial" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="overflow-hidden shadow-sm bg-white">
                            <CardHeader className="p-4 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg font-medium">Financial Summary</CardTitle>
                                    <BarChart3 className="h-5 w-5 text-gray-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-3 border-b">
                                        <div className="flex items-center">
                                            <div className="p-2 mr-3 bg-blue-100 rounded-full">
                                                <DollarSign className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <span className="font-medium">Gross Amount</span>
                                        </div>
                                        <span className="text-xl font-bold">{formatCurrency(totals?.gross ?? 0)}/=</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center py-3 border-b">
                                        <div className="flex items-center">
                                            <div className="p-2 mr-3 bg-indigo-100 rounded-full">
                                                <DollarSign className="h-4 w-4 text-indigo-600" />
                                            </div>
                                            <span className="font-medium">Net Amount</span>
                                        </div>
                                        <span className="text-xl font-bold">{formatCurrency(totals?.net ?? 0)}/=</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center py-3">
                                        <div className="flex items-center">
                                            <div className="p-2 mr-3 bg-green-100 rounded-full">
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                            </div>
                                            <span className="font-medium">Gross Profit</span>
                                        </div>
                                        <span className="text-xl font-bold text-green-600">{formatCurrency(totals?.profit ?? 0)}/=</span>
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div className="bg-green-600 h-2.5 rounded-full" style={{ 
                                            width: `${totals?.gross ? Math.min((totals?.profit / totals?.gross) * 100, 100) : 0}%` 
                                        }}></div>
                                    </div>
                                 </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};   

export default StaffReportDashboard;




