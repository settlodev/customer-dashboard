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
import { Form, FormField, FormItem} from '@/components/ui/form';
import { z } from 'zod';
import { FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchingStaffReport = async () => {
            try {
                const response = await staffReport(startDate, endDate);
                console.log("The staff report with no filter is: ", response);
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

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div></div>
                <Card>
                    <CardHeader>
                        {/* <CardTitle>Date Range Selection</CardTitle> */}
                    </CardHeader>
                    <CardContent className="space-y-1">
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

           
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">List of staff</CardTitle>
                        </CardHeader>
                        <CardContent>

                            <Table>
                                <TableCaption>A list of staffs with their report.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-bold">#</TableHead>
                                        <TableHead className="font-bold">Image</TableHead>
                                        <TableHead className="font-bold">Name</TableHead>
                                        <TableHead className="font-bold">Order Completed</TableHead>
                                        <TableHead className="font-bold">Item Sold</TableHead>
                                        <TableHead className="font-bold">Stock Intake Performed</TableHead>
                                        <TableHead className="font-bold">Gross Amount</TableHead>
                                        <TableHead className="font-bold">Net Amount</TableHead>
                                        <TableHead className="font-bold">Gross Profit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {staffData?.staffReport?.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {item.image ? <img src={item.image} alt={item.name} /> : 'No Image'}
                                            </TableCell>
                                            <TableCell className='font-medium'>{item.name}</TableCell>
                                            <TableCell className='font-medium'>{item.totalOrdersCompleted}</TableCell>
                                            <TableCell className='font-medium'>{item.totalItemsSold}</TableCell>
                                            <TableCell className='font-medium'>{item.totalStockIntakePerformed}</TableCell>
                                            <TableCell className='font-medium'>{formatCurrency(item.totalGrossAmount)}</TableCell>
                                            <TableCell className='font-medium'>{formatCurrency(item.totalNetAmount)}</TableCell>
                                            <TableCell className='font-medium'>{formatCurrency(item.totalGrossProfit)}</TableCell>
                                        </TableRow>
                                    ))}

                                  
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
        </div>
    );
};

export default StaffReportDashboard;





