'use client';
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Download } from 'lucide-react';
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
import { creditReport } from '@/lib/actions/order-actions';
import { Credit } from '@/types/orders/type';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getCurrentLocation } from '@/lib/actions/business/get-current-business';
import { Location } from '@/types/location/type';
import Loading from '@/app/loading';

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
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [location, setLocation] = useState<Location>();
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

    useEffect(() => {
        const fetchLocation = async () => {
            const location = await getCurrentLocation();
            setLocation(location);
        };
        fetchLocation();
    }, []);

    const fetchCreditReport = async (startDate: Date, endDate: Date) => {
        setIsLoading(true);
        try {
            const response = await creditReport(startDate, endDate);
            setCreditData(response);



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
            currency: 'TSH',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    
    const generatePDF = async () => {
        if (!creditData) {
            toast({
                variant: "destructive",
                title: "No data to export",
                description: "Please generate a report first before downloading PDF.",
            });
            return;
        }

        setDownloadingPdf(true);

        try {
            const doc = new jsPDF();

            // Set up document styling
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;

            // Title
            doc.setFontSize(10);
            doc.setFont('Arial', 'bold');
            doc.text('CREDIT REPORT', margin, 30);

            doc.setFontSize(10);
            doc.setFont('Arial', 'normal');
            const dateRange = `${format(new Date(creditData.startDate), 'MMM dd, yyyy HH:mm')} - ${format(new Date(creditData.endDate), 'MMM dd, yyyy HH:mm')}`;
            doc.text(`Period: ${dateRange}`, margin, 40);
            doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, margin, 45);



            if (location) {
                doc.setFontSize(10);
                doc.setFont('Arial', 'normal');
                const rightMargin = pageWidth - margin;
                let yPos = 30;

                // Location Name
                doc.setFont('Arial', 'bold');
                doc.text(location.name, rightMargin, yPos, { align: 'right' });
                yPos += 5;

                // Address
                doc.setFont('Arial', 'normal');
                const addressLines = doc.splitTextToSize(location.address || '', 150);
                addressLines.forEach((line: string) => {
                    doc.text(line, rightMargin, yPos, { align: 'right' });
                    yPos += 5;
                });

                // Phone
                if (location.phone) {
                    doc.text(`Phone: ${location.phone}`, rightMargin, yPos, { align: 'right' });
                    yPos += 5;
                }

                // Email
                if (location.email) {
                    doc.text(`Email: ${location.email}`, rightMargin, yPos, { align: 'right' });
                }
            }




            // Summary Box
            doc.setFillColor(240, 248, 255);
            doc.rect(margin, 70, pageWidth - 2 * margin, 45, 'F');

            doc.setFontSize(14);
            doc.setFont('Arial', 'bold');
            doc.text('SUMMARY', margin + 5, 85);

            doc.setFontSize(12);
            doc.setFont('Arial', 'normal');
            doc.text(`Total Unpaid Orders: ${creditData.total}`, margin + 5, 92);
            doc.text(`Total Unpaid Amount: ${formatCurrency(creditData.totalUnpaidAmount)}`, margin + 5, 99);
            doc.text(`Total Paid Amount: ${formatCurrency(creditData.totalPaidAmount)}`, margin + 5, 106);

            // Unpaid Orders Table
            let yPosition = 130;

            doc.setFontSize(10);
            doc.setFont('Arial', 'bold');
            doc.text('Unpaid Orders', margin, yPosition);
            yPosition += 5;

            // Prepare table data
            const tableData = creditData.unpaidOrders.map(order => [
                order.orderNumber,
                order.orderName || 'N/A',
                format(new Date(order.openedDate), 'MMM dd, yyyy'),
                order.customerName || 'N/A',
                formatCurrency(order.paidAmount),
                formatCurrency(order.unpaidAmount)
            ]);

            // Create table
            doc.autoTable({
                startY: yPosition,
                head: [['Order Number', 'Order Name', 'Date', 'Customer', 'Paid Amount', 'Unpaid Amount']],
                body: tableData,
                margin: { left: margin, right: margin },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                },
                headStyles: {
                    fillColor: [239, 68, 68], // Red color for unpaid theme
                    textColor: 255,
                    fontStyle: 'bold',
                },
                alternateRowStyles: {
                    fillColor: [254, 242, 242], // Light red background
                },
                columnStyles: {
                    4: { halign: 'right' }, // Paid Amount
                    5: { halign: 'right' }, // Unpaid Amount
                }
            });

            const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50;
            const pageHeight = doc.internal.pageSize.height;
            const footerY = pageHeight - 20;

            // If there's not enough space, add a new page
            if (finalY > pageHeight - 60) {
                doc.addPage();
            }

            // Add the disclaimer text with border
            doc.setFontSize(8);
            doc.setTextColor(32, 32, 32);
            const disclaimerText = 'This report is confidential and intended solely for the recipient. Any discrepancies must be reported to support@setllo.co.tz within 14 days of issuance';

            // Split disclaimer into multiple lines if needed
            const maxWidth = pageWidth - 2 * margin;
            const disclaimerLines = doc.splitTextToSize(disclaimerText, maxWidth);

            // Calculate positions
            const lineHeight = 3;
            const disclaimerHeight = disclaimerLines.length * lineHeight;
            const poweredByHeight = lineHeight;
            const totalFooterHeight = disclaimerHeight + poweredByHeight + 2; // 2px gap

            const disclaimerStartY = footerY - totalFooterHeight + lineHeight;

            // Calculate border dimensions
            const borderPadding = 3; // Padding inside the border
            const borderX = margin - borderPadding;
            const borderY = disclaimerStartY - lineHeight - borderPadding;
            const borderWidth = pageWidth - 2 * margin + 2 * borderPadding;
            const borderHeight = totalFooterHeight + 2 * borderPadding;

            // Draw border rectangle
            doc.setDrawColor(32, 32, 32); // Gray border color
            doc.setLineWidth(0.3); // Border thickness
            doc.rect(borderX, borderY, borderWidth, borderHeight, 'S'); // 'S' for stroke only

            // Optional: Add background color to the bordered area
            // Uncomment the lines below if you want a background color
            // doc.setFillColor(248, 249, 250); // Light gray background
            // doc.rect(borderX, borderY, borderWidth, borderHeight, 'FD'); // 'FD' for fill and draw

            // Add disclaimer lines centered
            disclaimerLines.forEach((line: string, index: number) => {
                const textWidth = doc.getTextWidth(line);
                const centerX = (pageWidth - textWidth) / 2;
                doc.text(line, centerX, disclaimerStartY + (index * lineHeight));
            });

            // Add "Powered by Settlo" below the disclaimer
            const poweredByText = 'Powered by Settlo';
            const poweredByWidth = doc.getTextWidth(poweredByText);
            const poweredByCenterX = (pageWidth - poweredByWidth) / 2;
            const poweredByY = disclaimerStartY + disclaimerHeight + 2; // 2px gap

            doc.text(poweredByText, poweredByCenterX, poweredByY);

            // Generate filename
            const filename = `credit-report-${format(new Date(creditData.startDate), 'yyyy-MM-dd')}-to-${format(new Date(creditData.endDate), 'yyyy-MM-dd')}.pdf`;

            // Save the PDF
            doc.save(filename);

            toast({
                title: "PDF Downloaded",
                description: `Report saved as ${filename}`,
            });

        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                variant: "destructive",
                title: "PDF Generation Failed",
                description: "There was an error generating the PDF. Please try again.",
            });
        } finally {
            setDownloadingPdf(false);
        }
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
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={generatePDF}
                        disabled={downloadingPdf}
                        className="flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        {downloadingPdf ? 'Generating PDF...' : 'Export PDF'}
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order Number</TableHead>
                                <TableHead>Order Name</TableHead>
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
                                        <TableCell>{order.orderName || 'N/A'}</TableCell>
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