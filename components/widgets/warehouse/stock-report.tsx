'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  AlertCircle, 
  TrendingUp, 
  Package, 
  DollarSign, 
  RefreshCw,
} from 'lucide-react'
import { LowStockItem, OutOfStockItem, StockHistory } from './dashboard'
import { stockReportFromWarehouse } from '@/lib/actions/warehouse/stock-actions'
import Loading from '@/app/loading'


const SummaryCard = ({ 
  title, 
  value, 
  colorClass = "", 
  progress = null, 
  icon: Icon,
  subtitle = ""
}: { 
  title: string
  value: string | number
  colorClass?: string
  progress?: number | null
  icon?: React.ElementType
  subtitle?: string
}) => {
  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
      <div className={`absolute top-0 right-0 w-1 h-full ${
        colorClass === "text-amber-500" 
          ? "bg-amber-500" 
          : colorClass === "text-red-500" 
          ? "bg-red-500" 
          : "bg-blue-500"
      }`} />
    </Card>
  )
}

// Enhanced Stock Items Table
const StockItemsTable = ({ 
  lowStockItems, 
  outOfStockItems 
}: { 
  lowStockItems: LowStockItem[]
  outOfStockItems: OutOfStockItem[] 
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [showLowStock, setShowLowStock] = useState(true)
  const [showOutOfStock, setShowOutOfStock] = useState(true)

  // Combine and filter items
  const allItems = [
    ...lowStockItems.map(item => ({
      ...item,
      status: "Low stock" as const,
      currentStock: item.remainingAmount
    })),
    ...outOfStockItems.map(item => ({
      ...item,
      status: "Out of stock" as const,
      currentStock: 0,
      remainingAmount: 0
    }))
  ]

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.stockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.stockVariantName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = (showLowStock && item.status === "Low stock") ||
                         (showOutOfStock && item.status === "Out of stock")
    return matchesSearch && matchesFilter
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Stock Alerts ({allItems.length})
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search items..." 
                className="pl-8 w-full sm:w-64" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Badge 
                variant={showLowStock ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setShowLowStock(!showLowStock)}
              >
                Low Stock ({lowStockItems.length})
              </Badge>
              <Badge 
                variant={showOutOfStock ? "destructive" : "outline"}
                className="cursor-pointer"
                onClick={() => setShowOutOfStock(!showOutOfStock)}
              >
                Out of Stock ({outOfStockItems.length})
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No items found matching your criteria</p>
          </div>
        ) : (
          <div className="relative overflow-x-auto rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 border-b">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">Item Details</th>
                  <th scope="col" className="px-6 py-4 font-medium">Variant</th>
                  <th scope="col" className="px-6 py-4 font-medium">Current Stock</th>
                  <th scope="col" className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.stockName}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.stockVariantName}</td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        item.currentStock === 0 ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {item.currentStock} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${
                        item.status === "Out of stock" 
                          ? "text-red-600" 
                          : "text-amber-600"
                      }`}>
                        <AlertCircle className="w-4 h-4" />
                        <Badge variant={item.status === "Out of stock" ? "destructive" : "secondary"}>
                          {item.status}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main Stock Report Component
const WarehouseStockReport = () => {
  const [stockData, setStockData] = useState<StockHistory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStockData = async () => {
    try {
      setError(null)
      const data = await stockReportFromWarehouse()
      setStockData(data)
    } catch (err) {
      setError('Failed to load stock report data')
      console.error('Stock report error:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchStockData()
  }

  useEffect(() => {
    fetchStockData()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center">
          <Loading/>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Error Loading Stock Report</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchStockData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stockData) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">No stock data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalItems = stockData.lowStockItems.length + stockData.outOfStockItems.length
  const lowStockPercentage = totalItems > 0 ? (stockData.lowStockItems.length / totalItems) * 100 : 0
  const outOfStockPercentage = totalItems > 0 ? (stockData.outOfStockItems.length / totalItems) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div className='space-y-1'>
          <h3 className="text-lg font-semibold text-gray-900">Stock Overview</h3>
          <p className="text-sm text-gray-600">Current warehouse stock status and alerts</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard 
          title="Total Stock Intakes" 
          value={stockData.totalStockIntakes.toLocaleString()}
          icon={TrendingUp}
          subtitle="Items received"
        />
        <SummaryCard 
          title="Stock Value" 
          value={stockData.totalStockValue.toLocaleString()}
          icon={DollarSign}
          subtitle="Total inventory value"
        />
        <SummaryCard 
          title="Stock Remaining" 
          value={stockData.totalStockRemaining.toLocaleString()}
          icon={Package}
          subtitle="Available units"
        />
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard 
          title="Low Stock Alerts" 
          value={stockData.lowStockItems.length}
          colorClass="text-amber-600"
          progress={lowStockPercentage}
          icon={AlertCircle}
          subtitle="Items running low"
        />
        <SummaryCard 
          title="Out of Stock" 
          value={stockData.outOfStockItems.length}
          colorClass="text-red-600"
          progress={outOfStockPercentage}
          icon={AlertCircle}
          subtitle="Items unavailable"
        />
      </div>

      {/* Stock Items Table */}
      <StockItemsTable 
        lowStockItems={stockData.lowStockItems}
        outOfStockItems={stockData.outOfStockItems}
      />
    </div>
  )
}

export default WarehouseStockReport;