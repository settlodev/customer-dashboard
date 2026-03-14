import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, TrendingDown, DollarSign, RefreshCcw, ShoppingCart, TrendingUp, BarChart, Clock, CheckCircle, Package } from 'lucide-react';

const StatCard = ({
  label,
  value,
  icon: Icon,
  valueColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  valueColor?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>
    </CardHeader>
    <CardContent className="px-4 pb-4 pt-0">
      <div className={`text-2xl font-bold ${valueColor || 'text-gray-900 dark:text-gray-100'}`}>
        {value}
      </div>
    </CardContent>
  </Card>
);

const SalesDashboard = ({ salesData }: { salesData: any }) => {
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0 TZS';
    return `${value.toLocaleString()} TZS`;
  };

  return (
    <div className="space-y-6">
      {/* Order status */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Order status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total orders" value={salesData?.totalOrders || 0} icon={Package} />
          <StatCard label="Completed orders" value={salesData?.completedOrders || 0} icon={CheckCircle} />
          <StatCard label="Pending orders" value={salesData?.pendingOrders || 0} icon={Clock} />
        </div>
      </div>

      {/* Payment status */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Payment status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard label="Paid amount" value={formatCurrency(salesData?.paidAmount)} icon={DollarSign} />
          <StatCard
            label="Unpaid amount"
            value={formatCurrency(salesData?.unpaidAmount)}
            icon={DollarSign}
            valueColor="text-amber-600 dark:text-amber-400"
          />
        </div>
      </div>

      {/* Revenue stream */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Revenue stream</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Gross sales" value={formatCurrency(salesData?.grossSales)} icon={DollarSign} />
          <StatCard label="Refunds" value={formatCurrency(salesData?.refundsAmount)} icon={RefreshCcw} />
          <StatCard label="Discounts" value={formatCurrency(salesData?.discountsAmount)} icon={RefreshCcw} />
          <StatCard label="Net sales" value={formatCurrency(salesData?.netSales)} icon={DollarSign} />
        </div>
      </div>

      {/* Profit analysis */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profit analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Costs (COGS)" value={formatCurrency(salesData?.costsAmount)} icon={ShoppingCart} />
          <StatCard label="Gross profit" value={formatCurrency(salesData?.grossProfit)} icon={TrendingUp} />
          <StatCard label="Total expenses" value={formatCurrency(salesData?.expensesPaidAmount)} icon={BarChart} />
        </div>
      </div>

      {/* Net profit / loss */}
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">
              {salesData?.netProfit >= 0 ? 'Net profit' : 'Net loss'}
            </p>
            <p className={`text-3xl font-bold mt-1 ${salesData?.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(salesData?.netProfit)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {salesData?.netProfit >= 0 ?
              <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" /> :
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesDashboard;
