import { Customer, CustomerPreference } from "@/types/customer/type";
import { getCustomerById, fetchCustomerPreferences } from "@/lib/actions/customer-actions";
import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CustomerForm from "@/components/forms/customer_form";

type Params = Promise<{ id: string }>;

export default async function CustomerEditPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  let item: Customer | null = null;
  let preferences: CustomerPreference[] = [];

  try {
    const customerId = resolvedParams.id as UUID;
    const [customer, prefs] = await Promise.all([
      getCustomerById(customerId),
      fetchCustomerPreferences(customerId),
    ]);
    item = customer;
    preferences = prefs ?? [];
  } catch (error) {
    console.log(error);
    throw new Error("Failed to load customer details");
  }

  if (!item) notFound();

  const breadCrumbItems = [
    { title: "Customers", link: "/customers" },
    { title: item.firstName + " " + item.lastName, link: `/customers/${item.id}` },
    { title: "Edit", link: "" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1">
          <BreadcrumbsNav items={breadCrumbItems} />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit customer details</CardTitle>
          <CardDescription>
            Update information for {item.firstName} {item.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm item={item} preferences={preferences} />
        </CardContent>
      </Card>
    </div>
  );
}
