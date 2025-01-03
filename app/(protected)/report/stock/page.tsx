'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Package2, PackageX, PackageMinus } from "lucide-react";
import { StockHistory } from '@/types/stock/type';
import { stockHistory } from '@/lib/actions/stock-actions';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Loading from '../../loading';


const StockHistoryDashboard = () => {
    const [history, setHistory] = useState<StockHistory | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStockHistory = async () => {
            try {
                const response = await stockHistory();
                setHistory(response);
            } catch (error) {
                console.error("Error fetching stock history:", error);
            }
        finally {
            setIsLoading(false);
          }
        };

        fetchStockHistory();
    }, []);

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
            <h2 className="text-2xl font-semibold">Stock History</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Stock Intakes */}
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

                {/* Total Stock Remaining */}
                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Current Stock Level
                        </CardTitle>
                        <Package2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">

                            {Intl.NumberFormat().format(history?.totalStockRemaining || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total units currently in stock
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

            {/* Additional sections for low stock and out of stock items if needed */}

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
                                            <TableHead className="font-bold">Stock</TableHead>
                                            <TableHead className="font-bold">Item</TableHead>
                                            <TableHead className="font-bold">Remaining</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history?.lowStockItems.map((item, index )=> (
                                            <TableRow key={item.stockName}>
                                                 <TableCell className="font-medium">
                                                {index+1}
                                                </TableCell>
                                                <TableCell className="font-medium">{item.stockName}</TableCell>
                                                <TableCell className='font-medium'>{item.stockVariantName}</TableCell>
                                                <TableCell className='font-medium'>{Intl.NumberFormat().format(item.remainingAmount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
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
                                            <TableHead className="font-bold">Stock</TableHead>
                                            <TableHead className='font-bold'>Item</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history?.outOfStockItems.map((item, index) => (
                                            
                                            <TableRow key={item.stockName}>
                                                 <TableCell className="font-medium">
                                                {index+1}
                                                </TableCell>
                                                <TableCell className="font-medium">{item.stockName}</TableCell>
                                                <TableCell>{item.stockVariantName}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

        </div>
    );
};

export default StockHistoryDashboard;



