import { UUID } from "node:crypto";

import { notFound } from "next/navigation";
import { isNotFoundError } from "next/dist/client/components/not-found";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {ApiResponse} from "@/types/types";
import { getInvoice } from "@/lib/actions/invoice-actions";
import { Invoice } from "@/types/invoice/type";
// import InvoiceForm from "@/components/forms/invoice_form";

export default async function InvoicePage({params}: {
    params: { id: string };
}) {
    const isNewItem = params.id === "new";
    let item: ApiResponse<Invoice> | null = null;

    if (!isNewItem) {
        try {
            item = await getInvoice(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load role data");
        }
    }

    const breadcrumbItems = [
        { title: "Invoices", link: "/invoices" },
        {
            title: isNewItem ? "New" : item?.content[0]?.invoiceNumber || "Edit",
            link: "",
        },
    ];

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems} />
                </div>
            </div>

            <InvoiceCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const InvoiceCard = ({isNewItem}: {
    isNewItem: boolean;
    item: Invoice | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Create an Invoice" : "Edit invoice details"}</CardTitle>
            <CardDescription>
                {isNewItem ? "Create an Invoice for your business location" : "Edit invoice details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {/* <InvoiceForm item={item} /> */}
        </CardContent>
    </Card>
);
