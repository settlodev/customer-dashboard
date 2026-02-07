import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { searchStockPurchases } from "@/lib/actions/stock-purchase-actions";
import NoItems from "@/components/layouts/no-items";
import { LPOSelectionList } from "@/components/widgets/lpo-list";

const breadCrumbItems = [
  { title: "Stock Intake", link: "/stock-intakes" },
  {
    title: "Select Purchase Order",
    link: "/stock-intakes/accepted-purchase-orders",
  },
];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

async function AcceptedLPO({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 1;
  const pageLimit = Number(resolvedSearchParams.limit) || 40;

  try {
    const responseData = await searchStockPurchases(q, page, pageLimit);

    // Filter only SUBMITTED purchase orders
    const submittedLPOs = responseData.content.filter(
      (lpo) => lpo.status === "ACCEPTED",
    );

    return (
      <div className="flex-1 space-y-4 md:p-8 pt-6 px-4 mt-12">
        <div className="flex items-center justify-between mb-2">
          <div className="relative flex-1 md:max-w-md">
            <BreadcrumbsNav items={breadCrumbItems} />
          </div>
        </div>

        {submittedLPOs.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Select Purchase Order</CardTitle>
              <CardDescription>
                Choose a local purchase order to receive as stock intake
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LPOSelectionList lpos={submittedLPOs} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <NoItems
                newItemUrl="/stock-purchases/new"
                itemName="Purchase Orders"
              />
              <p className="text-center text-sm text-muted-foreground mt-4">
                No submitted purchase orders available. Create a new purchase
                order first.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error loading purchase orders:", error);
    return (
      <div className="flex-1 space-y-4 md:p-8 pt-6 px-4 mt-12">
        <div className="flex items-center justify-between mb-2">
          <div className="relative flex-1 md:max-w-md">
            <BreadcrumbsNav items={breadCrumbItems} />
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-destructive font-semibold mb-2">
                Failed to load purchase orders
              </p>
              <p className="text-sm text-muted-foreground">
                Please try again later or contact support if the problem
                persists.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default AcceptedLPO;
