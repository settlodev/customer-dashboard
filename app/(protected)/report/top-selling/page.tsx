'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { topSellingProduct } from '@/lib/actions/product-actions';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SoldItem, TopSellingProduct } from '@/types/product/type';
import SubmitButton from '@/components/widgets/submit-button';
import { toast } from '@/hooks/use-toast';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

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

const SalesDashboard = () => {
    const [startDate] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const [endDate] = useState(new Date());
    const [sampleData, setSampleData] = useState<TopSellingProduct | null>(null);
    const limit = 5

    useEffect(() => {
        const fetchingTopSellingProducts = async () => {
            try {
                const response = await topSellingProduct(startDate, endDate, limit);
                setSampleData(response);
            } catch (error) {
                console.error("Error fetching stock history:", error);
            }
        };

        fetchingTopSellingProducts();
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
            limit: limit,
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
        console.log("Form values:", values);
        try {
            const response = await topSellingProduct(values.startDate, values.endDate, values.limit);
            setSampleData(response);
        } catch (error) {
            console.error("Error fetching stock history:", error);
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

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Date Range Selection</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
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
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4'>
                                    <FormField
                                        control={form.control}
                                        name="limit"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        placeholder="Limit"
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    <p className="text-sm text-muted-foreground">
                                                        Number of top selling items to show, Eg : 5
                                                    </p>
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                    <SubmitButton isPending={form.formState.isSubmitting} label='Filter' />
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Selected Range:</p>
                            <p className="font-medium">
                                {sampleData?.startDate ? format(sampleData?.startDate, "PPP HH:mm") : format(startDate, "PPP HH:mm")}
                                -
                                {sampleData?.endDate ? format(sampleData?.endDate, "PPP HH:mm") : format(endDate, "PPP HH:mm")}
                            </p>
                            <p className="text-sm text-muted-foreground mt-4">Total Quantity Sold:</p>
                            <p className="font-medium">{formatCurrency(sampleData?.totalQuantitySold ?? 0)}</p>

                            <p className="text-sm text-muted-foreground mt-4">Total Revenue:</p>
                            <p className="font-medium">{formatCurrency(sampleData?.totalRevenue ?? 0)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="topSelling" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="topSelling">Top Selling Items</TabsTrigger>
                    <TabsTrigger value="soldItems">List of Sold Items</TabsTrigger>
                </TabsList>
                <TabsContent value="topSelling">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle>Top selling Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={sampleData?.topItems}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="productName" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value, name) => {
                                                if (name === 'revenue') return formatCurrency(Number(value));
                                                if (name === 'quantity') return `${Number(value)} units`;
                                                return value;
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="revenue" fill="#A3FFD6" name="Revenue" />
                                        <Bar dataKey="quantity" fill="#1E2A37" name="Quantity" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="soldItems" className='space-y-4'>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle>Bar Graph of Sold Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={sampleData?.soldItemsReport.items}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="productName" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value, name) => {
                                                if (name === 'profit') return formatCurrency(Number(value));
                                                if (name === 'quantity') return `${Number(value)} units`;
                                                return value;
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="profit" fill="#EB7118" name="Profit" />
                                        <Bar dataKey="quantity" fill="#1E2A37" name="Quantity" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">List of Sold Items</CardTitle>
                        </CardHeader>
                        <CardContent>

                            <Table>
                                <TableCaption>A list of sold items.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-bold">#</TableHead>
                                        <TableHead className="font-bold">Product</TableHead>
                                        <TableHead className="font-bold">Variant</TableHead>
                                        <TableHead className="font-bold">Category</TableHead>
                                        <TableHead className="font-bold">Quantity</TableHead>
                                        <TableHead className="font-bold">Price</TableHead>
                                        <TableHead className="font-bold">Cost</TableHead>
                                        <TableHead className="font-bold">Profit</TableHead>
                                        <TableHead className="font-bold">Margin</TableHead>
                                        <TableHead className="font-bold">Staff</TableHead>
                                        <TableHead className="font-bold">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sampleData?.soldItemsReport.items.map((item: SoldItem, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                            <TableCell className='font-medium'>{item.variantName}</TableCell>
                                            <TableCell className='font-medium'>{item.categoryName}</TableCell>
                                            <TableCell className='font-medium'>{Intl.NumberFormat().format(item.quantity)}</TableCell>
                                            <TableCell className='font-medium'>{formatCurrency(item.price)}</TableCell>
                                            <TableCell className='font-medium'>{formatCurrency(item.cost)}</TableCell>
                                            <TableCell className='font-medium'>{formatCurrency(item.profit)}</TableCell>
                                            <TableCell className='font-medium'>{item.margin}%</TableCell>
                                            <TableCell className='font-medium'>{item.staffName}</TableCell>
                                            <TableCell className='font-medium'>{Intl.DateTimeFormat().format(new Date(item.soldDate))}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>



         


        </div>
    );
};

export default SalesDashboard;





