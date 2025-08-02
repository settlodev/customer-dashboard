import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WarehouseSupplierForm from "@/components/forms/warehouse/supplier_form";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { getWarehouse } from "@/lib/actions/warehouse/list-warehouse";
import { notFound } from "next/navigation";
import WarehouseForm from "@/components/forms/warehouse/warehouse_form";

interface WarehousePageProps {
  params: Promise<{ id: string }>;
}

export default async function WarehousePage({ params }: WarehousePageProps) {
  const paramsData = await params;
  const isNewItem = paramsData.id === "new";
  let item: Warehouses | null = null;

  
  if (!isNewItem) {
    try {
      item = await getWarehouse(paramsData.id); 
      
      
      if (!item) {
        notFound();
      }
    } catch (error) {
      console.error("Failed to load warehouse details:", error);
      throw new Error("Failed to load warehouse details");
    }
  }

  const breadCrumbItems = [
    { title: "Warehouses", link: "/warehouse-profiles" },
    { 
      title: isNewItem ? "New Warehouse" : item?.name || "Edit Warehouse",
      link: ""
    }
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1">
          <BreadcrumbsNav items={breadCrumbItems} />
        </div>
      </div>
      
      <WarehouseCard isNewItem={isNewItem} item={item} />
    </div>
  );
}

interface WarehouseCardProps {
  isNewItem: boolean;
  item: Warehouses | null;
}

const WarehouseCard = ({ isNewItem, item }: WarehouseCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>
        {isNewItem ? "Add New Warehouse" : "Edit Warehouse Details"}
      </CardTitle>
      <CardDescription>
        {isNewItem 
          ? "Create a new warehouse for your business" 
          : "Update warehouse information"
        }
      </CardDescription>
    </CardHeader>
    
    <CardContent>
      <WarehouseForm item={item} />
    </CardContent>
  </Card>
);