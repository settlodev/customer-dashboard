'use client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Download, AlertCircle, Search } from 'lucide-react'
import React, { useState } from 'react'
import DatePicker from '../datepicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'

// Define proper types for our data structure
type StockItem = {
  id: number;
  name: string;
  category: string;
  currentStock: string;
  threshold: string;
  status: "Low stock" | "Out of stock" | "In stock";
}

type StockSummary = {
  totalStockItems: number;
  lowStockItems: number;
  outOfStock: number;
  stockTurnOverRate: number;
}

type PurchaseSummary = {
  totalPurchases: number;
  purchaseOrders: number;
  averageOrderValue: number;
  topSupplier: string;
}

type PurchaseCategory = {
  name: string;
  totalPurchases: number;
  averagePurchasePrice: number;
  orders: number;
  items: number;
}

type RequestSummary = {
  totalRequest: number;
  approvalRate: number;
  averageRequestTime: number;
  topDepartmentRequester: string;
}

type DepartmentRequest = {
  name: string;
  totalRequests: number;
  approvalRate: number;
  averageRequestTime: number;
  mostRequestedItem: string;
}

type TabData = {
  name: string;
  value: string;
  implemented: boolean;
  content?: {
    summary?: StockSummary | PurchaseSummary | RequestSummary;
    items?: StockItem[];
    categories?: PurchaseCategory[];
    departmentRequests?: DepartmentRequest[];
  }
}

// Summary Card Component
const SummaryCard = ({ title, value, colorClass = "", progress = null }: { 
  title: string; 
  value: string | number; 
  colorClass?: string;
  progress?: number | null;
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
        {progress !== null && (
          <Progress value={progress} className={`h-2 mt-2 ${colorClass === "text-amber-500" ? "bg-amber-100" : colorClass === "text-red-500" ? "bg-red-100" : "bg-gray-100"}`} />
        )}
      </CardContent>
    </Card>
  );
};

// Stock Items Table Component
const StockItemsTable = ({ items }: { items: StockItem[] }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Low Stock & Out of Stock Items</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input placeholder="Search items..." className="pl-8" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Item Name</th>
                <th scope="col" className="px-6 py-3">Category</th>
                <th scope="col" className="px-6 py-3">Current Stock</th>
                <th scope="col" className="px-6 py-3">Threshold</th>
                <th scope="col" className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{item.name}</td>
                  <td className="px-6 py-4">{item.category}</td>
                  <td className="px-6 py-4">{item.currentStock}</td>
                  <td className="px-6 py-4">{item.threshold}</td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 ${
                      item.status === "Out of stock" 
                        ? "text-red-500" 
                        : item.status === "Low stock"
                        ? "text-amber-500"
                        : "text-green-500"
                    }`}>
                      <AlertCircle className="w-4 h-4" />
                      {item.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// Stock Report Tab Content
const StockReportContent = ({ data }: { data: TabData }) => {
  const summary = data.content?.summary as StockSummary;
  const items = data.content?.items as StockItem[];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard 
          title="Total Stock Items" 
          value={summary.totalStockItems} 
        />
        <SummaryCard 
          title="Low Stock Items" 
          value={summary.lowStockItems} 
          colorClass="text-amber-500"
          progress={(summary.lowStockItems / summary.totalStockItems) * 100}
        />
        <SummaryCard 
          title="Out of Stock" 
          value={summary.outOfStock} 
          colorClass="text-red-500"
          progress={(summary.outOfStock / summary.totalStockItems) * 100}
        />
        <SummaryCard 
          title="Stock Turnover Rate" 
          value={summary.stockTurnOverRate} 
        />
      </div>

      {items && items.length > 0 && <StockItemsTable items={items} />}
    </div>
  );
};

// Purchase Report Tab Content
const PurchaseReportContent = ({ data }: { data: TabData }) => {
  const summary = data.content?.summary as PurchaseSummary;
  const categories = data.content?.categories as PurchaseCategory[];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Purchases" value={`$${summary.totalPurchases.toLocaleString()}`} />
        <SummaryCard title="Purchase Orders" value={summary.purchaseOrders} />
        <SummaryCard title="Average Order Value" value={`$${summary.averageOrderValue}`} />
        <SummaryCard title="Top Supplier" value={summary.topSupplier} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Purchase Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Category</th>
                  <th scope="col" className="px-6 py-3">Total Purchases</th>
                  <th scope="col" className="px-6 py-3">Avg. Price</th>
                  <th scope="col" className="px-6 py-3">Orders</th>
                  <th scope="col" className="px-6 py-3">Items</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{category.name}</td>
                    <td className="px-6 py-4">${category.totalPurchases.toLocaleString()}</td>
                    <td className="px-6 py-4">${category.averagePurchasePrice.toFixed(2)}</td>
                    <td className="px-6 py-4">{category.orders}</td>
                    <td className="px-6 py-4">{category.items}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Request Report Tab Content
const RequestReportContent = ({ data }: { data: TabData }) => {
  const summary = data.content?.summary as RequestSummary;
  const departmentRequests = data.content?.departmentRequests as DepartmentRequest[];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Requests" value={summary.totalRequest} />
        <SummaryCard title="Approval Rate" value={`${summary.approvalRate}%`} />
        <SummaryCard title="Avg. Request Time" value={`${summary.averageRequestTime} days`} />
        <SummaryCard title="Top Requester" value={summary.topDepartmentRequester} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Department Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Department</th>
                  <th scope="col" className="px-6 py-3">Total Requests</th>
                  <th scope="col" className="px-6 py-3">Approval Rate</th>
                  <th scope="col" className="px-6 py-3">Avg. Request Time</th>
                  <th scope="col" className="px-6 py-3">Most Requested Item</th>
                </tr>
              </thead>
              <tbody>
                {departmentRequests.map((dept, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{dept.name}</td>
                    <td className="px-6 py-4">{dept.totalRequests}</td>
                    <td className="px-6 py-4">{dept.approvalRate}%</td>
                    <td className="px-6 py-4">{dept.averageRequestTime} days</td>
                    <td className="px-6 py-4">{dept.mostRequestedItem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Placeholder for unimplemented tabs
const UnimplementedTabContent = ({ tabName }: { tabName: string }) => {
  return (
    <Card>
      <CardContent className="h-40 flex flex-col items-center justify-center gap-2">
        <AlertCircle className="w-6 h-6 text-amber-500" />
        <p className="text-gray-500">{tabName} report is coming soon.</p>
        <Button size="sm" variant="outline">Request Early Access</Button>
      </CardContent>
    </Card>
  );
};

function DashboardLayout() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  
  const tabs: TabData[] = [
    {
      name: "Stock Report",
      value: "stock",
      implemented: true,
      content: {
        summary: {
          totalStockItems: 2847,
          lowStockItems: 58,
          outOfStock: 12,
          stockTurnOverRate: 4.2
        },
        items: [
          {
            id: 1,
            name: "Olive Oil",
            category: "Food Items",
            currentStock: "8 units",
            threshold: "10 units",
            status: "Low stock"
          },
          {
            id: 2,
            name: "Printer Paper",
            category: "Office Supplies",
            currentStock: "2 boxes",
            threshold: "5 boxes",
            status: "Low stock"
          },
          {
            id: 3,
            name: "Hand Sanitizer",
            category: "Health Supplies",
            currentStock: "0 bottles",
            threshold: "20 bottles",
            status: "Out of stock"
          }
        ]
      }
    },
    {
      name: "Purchase Report",
      value: 'purchase',
      implemented: true,
      content: {
        summary: {
          totalPurchases: 456789,
          purchaseOrders: 42,
          averageOrderValue: 677,
          topSupplier: "Supplier A",
        },
        categories: [
          {
            name: "Food Items",
            totalPurchases: 12345,
            averagePurchasePrice: 2.5,
            orders: 30,
            items: 245
          },
          {
            name: "Office Supplies",
            totalPurchases: 67890,
            averagePurchasePrice: 1.2,
            orders: 10,
            items: 145
          },
          {
            name: "Health Supplies",
            totalPurchases: 54321,
            averagePurchasePrice: 3.5,
            orders: 20,
            items: 345
          },
        ]
      }
    },
    {
      name: "Request Report",
      value: "request",
      implemented: true,
      content: {
        summary: {
          totalRequest: 128,
          approvalRate: 92.5,
          averageRequestTime: 2,
          topDepartmentRequester: "Kitchen"
        },
        departmentRequests: [
          {
            name: "Kitchen",
            totalRequests: 42,
            approvalRate: 100,
            averageRequestTime: 1.5,
            mostRequestedItem: "Olive Oil",
          },
          {
            name: "Office",
            totalRequests: 30,
            approvalRate: 80,
            averageRequestTime: 2,
            mostRequestedItem: "Printer Paper",
          },
          {
            name: "Health",
            totalRequests: 10,
            approvalRate: 50,
            averageRequestTime: 3,
            mostRequestedItem: "Hand Sanitizer",
          }]
      }
    },
    {
      name: "Consumption",
      value: "consumption",
      implemented: false
    },
    {
      name: "Valuation",
      value: "valuation",
      implemented: false
    }
  ];

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // Simulate data loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    // Implement export functionality
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `inventory-report-${currentDate}.csv`;
    alert(`Exporting report as ${filename}`);
    // In a real implementation, you would generate and download the file
  };

  const handleCopy = () => {
    // Implement copy functionality
    alert('Report copied to clipboard');
    // In a real implementation, you would copy the data to clipboard
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Error Loading Report Data</h3>
        <p className="text-gray-500 mb-4">There was a problem loading your report data.</p>
        <Button onClick={() => setHasError(false)}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Reports Dashboard</h2>
        <div className='flex gap-4'>
          <DatePicker 
            selectedDate={selectedDate} 
            onDateChange={handleDateChange}
          />
          <Button 
            className='flex gap-2' 
            variant="outline"
            onClick={handleExport}
          >
            <Download className='w-4 h-4'/>
            Export Report
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={tabs[0].value} className="w-full">
        <TabsList className="mb-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="capitalize">
              {tab.name}
              {!tab.implemented && (
                <span className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">Soon</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {isLoading ? (
          <Card>
            <CardContent className="h-40 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-500">Loading report data...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.implemented ? (
                <>
                  {tab.value === "stock" && <StockReportContent data={tab} />}
                  {tab.value === "purchase" && <PurchaseReportContent data={tab} />}
                  {tab.value === "request" && <RequestReportContent data={tab} />}
                </>
              ) : (
                <UnimplementedTabContent tabName={tab.name} />
              )}
              
              <div className="mt-4 flex justify-end">
                <Button size="sm" variant="outline" className="flex gap-2" onClick={handleCopy}>
                  <Copy className="w-4 h-4" />
                  Copy Report
                </Button>
              </div>
            </TabsContent>
          ))
        )}
      </Tabs>
    </div>
  )
}

export default DashboardLayout