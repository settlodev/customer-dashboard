"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentTransaction } from "@/types/dashboard/type";

export default function RecentTransactionsTable({ data }: { data: RecentTransaction[] }) {
  const transactions = (data || []).slice(0, 10);

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2.5 text-xs font-medium text-muted-foreground">Order</th>
                <th className="text-left py-2.5 text-xs font-medium text-muted-foreground">Method</th>
                <th className="text-left py-2.5 text-xs font-medium text-muted-foreground">Staff</th>
                <th className="text-right py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-right py-2.5 text-xs font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b last:border-0">
                  <td className="py-2.5 font-medium text-xs">{tx.orderNumber}</td>
                  <td className="py-2.5 text-xs text-muted-foreground">{tx.acceptedPaymentMethodTypeName}</td>
                  <td className="py-2.5 text-xs text-muted-foreground">{tx.staffName}</td>
                  <td className="py-2.5 text-xs font-semibold text-right tabular-nums">
                    {tx.amount?.toLocaleString()} <span className="font-normal opacity-70">TZS</span>
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground text-right">
                    {new Date(tx.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    No recent transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
