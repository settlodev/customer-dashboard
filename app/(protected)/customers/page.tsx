

import {Table, TableBody, TableCell, TableCaption, TableFooter, TableHead, TableRow,TableHeader} from '@/components/ui/table';
import {Button} from "@/components/ui/button";
import Link from "next/link";

const invoices = [
    {
        invoice: 'INV-001',
        paymentStatus: 'Paid',
        paymentMethod: 'Credit Card',
        totalAmount: '$2,500.00',
    },
    {
        invoice: 'INV-002',
        paymentStatus: 'Pending',
        paymentMethod: 'PayPal',
        totalAmount: '$2,500.00',
    },
    {
        invoice: 'INV-003',
        paymentStatus: 'Paid',
        paymentMethod: 'Bank Transfer',
        totalAmount: '$2,500.00'
    }
]
function CustomersPage() {
    return (
        <div className={`flex-col mt-10`}>
            {/*<h1 className="text-3xl font-bold text-4xl leading-tight">Customers</h1>*/}
            <div>
               <Link href="/customers/create">
                   <Button>Create customer</Button>
               </Link>
            </div>
            <Table>
                <TableCaption>A list of your recent invoices.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Invoice</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice) => (
                        <TableRow key={invoice.invoice}>
                            <TableCell className="font-medium">{invoice.invoice}</TableCell>
                            <TableCell>{invoice.paymentStatus}</TableCell>
                            <TableCell>{invoice.paymentMethod}</TableCell>
                            <TableCell className="text-right">{invoice.totalAmount}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right">$2,500.00</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}

export default CustomersPage
