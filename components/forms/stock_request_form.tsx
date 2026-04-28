"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Package } from "lucide-react";
import { StockRequests } from "@/types/stock-request/type";

// Stubbed out: backend API for stock requests is being reworked. Restore the
// real form once the new schema/actions land.
function StockRequestForm(_props: { item: StockRequests | null | undefined }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Stock Requests
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Stock requests are temporarily unavailable while the API is being updated.
                </p>
            </CardContent>
        </Card>
    );
}

export default StockRequestForm;
