
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
import Loading from "@/components/ui/loading"

const ITEMS_PER_PAGE = 5
const VISIBLE_PAGES = 5

const StockHistoryDashboard = () => {
  const [history, setHistory] = useState<StockHistory | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [lowStockPage, setLowStockPage] = useState(1)
  const [outOfStockPage, setOutOfStockPage] = useState(1)

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
    if (lowStockPage > 1) setLowStockPage((p) => p - 1)
  }

  const handleNextLowStock = () => {
    if (lowStockPage < getLowStockPageCount()) setLowStockPage((p) => p + 1)
  }

  const handlePrevOutOfStock = () => {
    if (outOfStockPage > 1) setOutOfStockPage((p) => p - 1)
  }

  const handleNextOutOfStock = () => {
    if (outOfStockPage < getOutOfStockPageCount()) setOutOfStockPage((p) => p + 1)
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
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    )
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Stock report summary
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Overview of your current stock levels and inventory status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total available stock</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Package2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Intl.NumberFormat().format(history?.totalStockRemaining || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total stock value</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Intl.NumberFormat().format(history?.totalStockValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated profit</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Intl.NumberFormat().format(history?.totalEstimatedProfit || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total stock intakes</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Intl.NumberFormat().format(history?.totalStockIntakes || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low stock items</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <PackageMinus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {Intl.NumberFormat().format(history?.lowStockItems.length || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of stock items</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <PackageX className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {Intl.NumberFormat().format(history?.outOfStockItems.length || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {(history?.lowStockItems?.length ?? 0) + (history?.outOfStockItems?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(history?.lowStockItems?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <PackageMinus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Low stock items</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Stock item</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getLowStockItems().map((item, index) => (
                      <TableRow key={`${item.stockName}-${item.stockVariantName}-${index}`}>
                        <TableCell className="text-muted-foreground">{(lowStockPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {item.stockName} - {item.stockVariantName}
                        </TableCell>
                        <TableCell className="font-medium text-amber-600 dark:text-amber-400">
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

          {(history?.outOfStockItems?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <PackageX className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Out of stock items</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Stock item</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getOutOfStockItems().map((item, index) => (
                      <TableRow key={`${item.stockName}-${item.stockVariantName}-${index}`}>
                        <TableCell className="text-muted-foreground">
                          {(outOfStockPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-red-600 dark:text-red-400">
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
