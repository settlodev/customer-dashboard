
"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package2, PackageX, PackageMinus, DollarSign, TrendingUp, ClipboardList } from "lucide-react"
import type { StockHistory } from "@/types/stock/type"
import { stockHistory } from "@/lib/actions/stock-actions"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import Loading from "@/app/loading"

const ITEMS_PER_PAGE = 5
const VISIBLE_PAGES = 5

const StockHistoryDashboard = () => {
  const [history, setHistory] = useState<StockHistory | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [lowStockPage, setLowStockPage] = useState(1)
  const [outOfStockPage, setOutOfStockPage] = useState(1)

  const cardColors = {
    totalStock: {
      bg: "bg-blue-50",
      accent: "#0088FE",
      icon: <Package2 className="h-5 w-5" style={{ color: "#0088FE" }} />,
    },
    stockValue: {
      bg: "bg-green-50",
      accent: "#00C49F",
      icon: <DollarSign className="h-5 w-5" style={{ color: "#00C49F" }} />,
    },
    estimatedProfit: {
      bg: "bg-purple-50",
      accent: "#8884D8",
      icon: <TrendingUp className="h-5 w-5" style={{ color: "#8884D8" }} />,
    },
    stockIntakes: {
      bg: "bg-indigo-50",
      accent: "#8884D8",
      icon: <ClipboardList className="h-5 w-5" style={{ color: "#8884D8" }} />,
    },
    lowStock: {
      bg: "bg-yellow-50",
      accent: "#FFBB28",
      icon: <PackageMinus className="h-5 w-5" style={{ color: "#FFBB28" }} />,
    },
    outOfStock: {
      bg: "bg-red-50",
      accent: "#FF8042",
      icon: <PackageX className="h-5 w-5" style={{ color: "#FF8042" }} />,
    },
  }
  useEffect(() => {
    const fetchStockHistory = async () => {
      try {
        const response = await stockHistory()
        setHistory(response)
      } catch (error) {
        console.error("Error fetching stock history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStockHistory()
  }, [])
  const getPageRange = (currentPage: number, totalPages: number) => {
    let start = Math.max(1, currentPage - Math.floor(VISIBLE_PAGES / 2))
    const end = Math.min(totalPages, start + VISIBLE_PAGES - 1)

    
    if (end === totalPages) {
      start = Math.max(1, end - VISIBLE_PAGES + 1)
    }

    const pages: (number | string)[] = []

    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push("...")
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...")
      pages.push(totalPages)
    }

    return pages
  }

  // Pagination calculations
  const getLowStockItems = () => {
    if (!history?.lowStockItems) return []
    const startIndex = (lowStockPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return history.lowStockItems.slice(startIndex, endIndex)
  }

  const getOutOfStockItems = () => {
    if (!history?.outOfStockItems) return []
    const startIndex = (outOfStockPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return history.outOfStockItems.slice(startIndex, endIndex)
  }

  const getLowStockPageCount = () => {
    return Math.ceil((history?.lowStockItems?.length || 0) / ITEMS_PER_PAGE)
  }

  const getOutOfStockPageCount = () => {
    return Math.ceil((history?.outOfStockItems?.length || 0) / ITEMS_PER_PAGE)
  }
  const handlePrevLowStock = () => {
    if (lowStockPage > 1) {
      setLowStockPage((p) => p - 1)
    }
  }

  const handleNextLowStock = () => {
    if (lowStockPage < getLowStockPageCount()) {
      setLowStockPage((p) => p + 1)
    }
  }

  const handlePrevOutOfStock = () => {
    if (outOfStockPage > 1) {
      setOutOfStockPage((p) => p - 1)
    }
  }

  const handleNextOutOfStock = () => {
    if (outOfStockPage < getOutOfStockPageCount()) {
      setOutOfStockPage((p) => p + 1)
    }
  }

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
    onPrev: () => void,
    onNext: () => void,
  ) => {
    if (totalPages <= 1) return null

    const pages = getPageRange(currentPage, totalPages)

    return (
      <div className="mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={onPrev}
                className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>

            {pages.map((page, index) => (
              <PaginationItem key={index}>
                {page === "..." ? (
                  <span className="px-4 py-2">...</span>
                ) : (
                  <PaginationLink onClick={() => onPageChange(page as number)} isActive={currentPage === page}>
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={onNext}
                className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Stock History</h2>
        <div className="flex space-x-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#0088FE" }}></div>
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#00C49F" }}></div>
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#FFBB28" }}></div>
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#FF8042" }}></div>
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#8884D8" }}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Available Stock */}
        <Card className={`shadow-md hover:shadow-lg transition-shadow ${cardColors.totalStock.bg} border-0`}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0, 136, 254, 0.1)" }}
            >
              <Package2 className="h-4 w-4" style={{ color: "#0088FE" }} />
            </div>
            <CardTitle className="text-xs font-medium text-gray-600">Total Available Stock</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-4">
            <div className="text-2xl font-bold" style={{ color: cardColors.totalStock.accent }}>
              {Intl.NumberFormat().format(history?.totalStockRemaining || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total items currently in stock</p>
          </CardContent>
        </Card>

        {/* Total Stock Value */}
        <Card className={`shadow-md hover:shadow-lg transition-shadow ${cardColors.stockValue.bg} border-0`}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0, 196, 159, 0.1)" }}
            >
              <DollarSign className="h-4 w-4" style={{ color: "#00C49F" }} />
            </div>
            <CardTitle className="text-xs font-medium text-gray-600">Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-4">
            <div className="text-2xl font-bold" style={{ color: cardColors.stockValue.accent }}>
              {Intl.NumberFormat().format(history?.totalStockValue || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total value of stock items</p>
          </CardContent>
        </Card>

        {/* Estimated profit */}
        <Card className={`shadow-md hover:shadow-lg transition-shadow ${cardColors.estimatedProfit.bg} border-0`}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(136, 132, 216, 0.1)" }}
            >
              <TrendingUp className="h-4 w-4" style={{ color: "#8884D8" }} />
            </div>
            <CardTitle className="text-xs font-medium text-gray-600">Estimated Profit</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-4">
            <div className="text-2xl font-bold" style={{ color: cardColors.estimatedProfit.accent }}>
              {Intl.NumberFormat().format(history?.totalEstimatedProfit || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total estimated profit</p>
          </CardContent>
        </Card>

        {/* Total Stock Intakes */}
        <Card className={`shadow-md hover:shadow-lg transition-shadow ${cardColors.stockIntakes.bg} border-0`}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(136, 132, 216, 0.1)" }}
            >
              <ClipboardList className="h-4 w-4" style={{ color: "#8884D8" }} />
            </div>
            <CardTitle className="text-xs font-medium text-gray-600">Total Stock Intakes</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-4">
            <div className="text-2xl font-bold" style={{ color: cardColors.stockIntakes.accent }}>
              {Intl.NumberFormat().format(history?.totalStockIntakes || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total number of stock intake records</p>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className={`shadow-md hover:shadow-lg transition-shadow ${cardColors.lowStock.bg} border-0`}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255, 187, 40, 0.1)" }}
            >
              <PackageMinus className="h-4 w-4" style={{ color: "#FFBB28" }} />
            </div>
            <CardTitle className="text-xs font-medium text-gray-600">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-4">
            <div className="text-2xl font-bold" style={{ color: cardColors.lowStock.accent }}>
              {Intl.NumberFormat().format(history?.lowStockItems.length || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Items below minimum stock level</p>
          </CardContent>
        </Card>

        {/* Out of Stock Items */}
        <Card className={`shadow-md hover:shadow-lg transition-shadow ${cardColors.outOfStock.bg} border-0`}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255, 128, 66, 0.1)" }}
            >
              <PackageX className="h-4 w-4" style={{ color: "#FF8042" }} />
            </div>
            <CardTitle className="text-xs font-medium text-gray-600">Out of Stock Items</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-4">
            <div className="text-2xl font-bold" style={{ color: cardColors.outOfStock.accent }}>
              {Intl.NumberFormat().format(history?.outOfStockItems.length || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Items completely out of stock</p>
          </CardContent>
        </Card>
      </div>

      {(history?.lowStockItems?.length ?? 0) + (history?.outOfStockItems?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Low Stock Items List */}
          {(history?.lowStockItems?.length ?? 0) > 0 && (
            <Card className="shadow-md border-t-4" style={{ borderTopColor: "#FFBB28" }}>
              <CardHeader className="bg-yellow-50">
                <div className="flex items-center space-x-2">
                  <PackageMinus className="h-5 w-5" style={{ color: "#FFBB28" }} />
                  <CardTitle className="text-lg font-bold">Low Stock Items</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>Items below minimum stock level</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold text-gray-700">#</TableHead>
                      <TableHead className="font-bold text-gray-700">Stock Item</TableHead>
                      <TableHead className="font-bold text-gray-700">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getLowStockItems().map((item, index) => (
                      <TableRow key={item.stockName} className="hover:bg-yellow-50">
                        <TableCell className="font-medium">{(lowStockPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {item.stockName} - {item.stockVariantName}
                        </TableCell>
                        <TableCell className="font-medium text-amber-600">
                          {Intl.NumberFormat().format(item.remainingAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {renderPagination(
                  lowStockPage,
                  getLowStockPageCount(),
                  (page) => setLowStockPage(page),
                  handlePrevLowStock,
                  handleNextLowStock,
                )}
              </CardContent>
            </Card>
          )}

          {/* Out of Stock Items List */}
          {(history?.outOfStockItems?.length ?? 0) > 0 && (
            <Card className="shadow-md border-t-4" style={{ borderTopColor: "#FF8042" }}>
              <CardHeader className="bg-red-50">
                <div className="flex items-center space-x-2">
                  <PackageX className="h-5 w-5" style={{ color: "#FF8042" }} />
                  <CardTitle className="text-lg font-bold">Out of Stock Items</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>Items completely out of stock</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold text-gray-700">#</TableHead>
                      <TableHead className="font-bold text-gray-700">Stock Item</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getOutOfStockItems().map((item, index) => (
                      <TableRow key={item.stockName} className="hover:bg-red-50">
                        <TableCell className="font-medium">
                          {(outOfStockPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-red-600">
                          {item.stockName} - {item.stockVariantName}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {renderPagination(
                  outOfStockPage,
                  getOutOfStockPageCount(),
                  (page) => setOutOfStockPage(page),
                  handlePrevOutOfStock,
                  handleNextOutOfStock,
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default StockHistoryDashboard
