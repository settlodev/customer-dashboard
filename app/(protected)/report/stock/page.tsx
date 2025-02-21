'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Package2, PackageX, PackageMinus } from "lucide-react";
import { StockHistory } from '@/types/stock/type';
import { stockHistory } from '@/lib/actions/stock-actions';
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import Loading from '../../loading';

const ITEMS_PER_PAGE = 5;
const VISIBLE_PAGES = 5;

const StockHistoryDashboard = () => {
    const [history, setHistory] = useState<StockHistory | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination states
    const [lowStockPage, setLowStockPage] = useState(1);
    const [outOfStockPage, setOutOfStockPage] = useState(1);

    useEffect(() => {
        const fetchStockHistory = async () => {
            try {
                const response = await stockHistory();
                console.log("The stock history is: ", response)
                setHistory(response);
            } catch (error) {
                console.error("Error fetching stock history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStockHistory();
    }, []);
    const getPageRange = (currentPage: number, totalPages: number) => {
        let start = Math.max(1, currentPage - Math.floor(VISIBLE_PAGES / 2));
        const end = Math.min(totalPages, start + VISIBLE_PAGES - 1);

        // Adjust start if we're near the end
        if (end === totalPages) {
            start = Math.max(1, end - VISIBLE_PAGES + 1);
        }

        // Generate array of page numbers
        const pages: (number | string)[] = [];

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('...');
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    // Pagination calculations
    const getLowStockItems = () => {
        if (!history?.lowStockItems) return [];
        const startIndex = (lowStockPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return history.lowStockItems.slice(startIndex, endIndex);
    };

    const getOutOfStockItems = () => {
        if (!history?.outOfStockItems) return [];
        const startIndex = (outOfStockPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return history.outOfStockItems.slice(startIndex, endIndex);
    };

    const getLowStockPageCount = () => {
        return Math.ceil((history?.lowStockItems?.length || 0) / ITEMS_PER_PAGE);
    };

    const getOutOfStockPageCount = () => {
        return Math.ceil((history?.outOfStockItems?.length || 0) / ITEMS_PER_PAGE);
    };
    const handlePrevLowStock = () => {
        if (lowStockPage > 1) {
            setLowStockPage(p => p - 1);
        }
    };

    const handleNextLowStock = () => {
        if (lowStockPage < getLowStockPageCount()) {
            setLowStockPage(p => p + 1);
        }
    };

    const handlePrevOutOfStock = () => {
        if (outOfStockPage > 1) {
            setOutOfStockPage(p => p - 1);
        }
    };

    const handleNextOutOfStock = () => {
        if (outOfStockPage < getOutOfStockPageCount()) {
            setOutOfStockPage(p => p + 1);
        }
    };

    const renderPagination = (
        currentPage: number,
        totalPages: number,
        onPageChange: (page: number) => void,
        onPrev: () => void,
        onNext: () => void
    ) => {
        if (totalPages <= 1) return null;

        const pages = getPageRange(currentPage, totalPages);

        return (
            <div className="mt-4">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={onPrev}
                                className={cn(
                                    currentPage === 1 && "pointer-events-none opacity-50"
                                )}
                            />
                        </PaginationItem>

                        {pages.map((page, index) => (
                            <PaginationItem key={index}>
                                {page === '...' ? (
                                    <span className="px-4 py-2">...</span>
                                ) : (
                                    <PaginationLink
                                        onClick={() => onPageChange(page as number)}
                                        isActive={currentPage === page}
                                    >
                                        {page}
                                    </PaginationLink>
                                )}
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext
                                onClick={onNext}
                                className={cn(
                                    currentPage === totalPages && "pointer-events-none opacity-50"
                                )}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">
                    <Loading />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-10">
            <h2 className="text-2xl font-semibold mt-6">Stock History</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                 {/* Total Available Stock */}
                 <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Available Stock
                        </CardTitle>
                        <Package2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">

                            {Intl.NumberFormat().format(history?.totalStockRemaining || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total items currently in stock
                        </p>
                    </CardContent>
                </Card>
                {/* Total Stock Value */}
                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total stock value
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Intl.NumberFormat().format(history?.totalStockValue || 0)} </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total value of stock items
                        </p>
                    </CardContent>
                </Card>
               
            
                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Stock Intakes
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Intl.NumberFormat().format(history?.totalStockIntakes || 0)} </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total number of stock intake records
                        </p>
                    </CardContent>
                </Card>

               

                {/* Low Stock Items */}
                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Low Stock Items
                        </CardTitle>
                        <PackageMinus className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Intl.NumberFormat().format(history?.lowStockItems.length || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Items below minimum stock level
                        </p>
                    </CardContent>
                </Card>

                {/* Out of Stock Items */}
                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Out of Stock Items
                        </CardTitle>
                        <PackageX className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Intl.NumberFormat().format(history?.outOfStockItems.length || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Items completely out of stock
                        </p>
                    </CardContent>
                </Card>
            </div>


            {(history?.lowStockItems?.length ?? 0) + (history?.outOfStockItems?.length ?? 0) > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* Low Stock Items List */}
                    {(history?.lowStockItems?.length ?? 0) > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Low Stock Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableCaption>A list of low stock items.</TableCaption>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-bold">#</TableHead>
                                            <TableHead className="font-bold">Stock Item</TableHead>
                                            <TableHead className="font-bold">Quantity</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {getLowStockItems().map((item, index) => (
                                            <TableRow key={item.stockName}>
                                                <TableCell className="font-medium">
                                                    {((lowStockPage - 1) * ITEMS_PER_PAGE) + index + 1}
                                                </TableCell>
                                                <TableCell className="font-medium">{item.stockName} - {item.stockVariantName}</TableCell>
                                                <TableCell className='font-medium'>{Intl.NumberFormat().format(item.remainingAmount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                               
                                {renderPagination(
                                    lowStockPage,
                                    getLowStockPageCount(),
                                    (page) => setLowStockPage(page),
                                    handlePrevLowStock,
                                    handleNextLowStock
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Out of Stock Items List */}
                    {(history?.outOfStockItems?.length ?? 0) > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Out of Stock Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableCaption>A list of out of stock items.</TableCaption>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-bold">#</TableHead>
                                            <TableHead className="font-bold">Stock Item</TableHead>
                                            {/* <TableHead className='font-bold'>Item</TableHead> */}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {getOutOfStockItems().map((item, index) => (
                                            <TableRow key={item.stockName}>
                                                <TableCell className="font-medium">
                                                    {((outOfStockPage - 1) * ITEMS_PER_PAGE) + index + 1}
                                                </TableCell>
                                                <TableCell className="font-medium">{item.stockName} - {item.stockVariantName}</TableCell>

                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {renderPagination(
                                    outOfStockPage,
                                    getOutOfStockPageCount(),
                                    (page) => setOutOfStockPage(page),
                                    handlePrevOutOfStock,
                                    handleNextOutOfStock
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default StockHistoryDashboard;