"use client";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
// import ChartOne from "@/components/dashboard/Charts/ChartOne";
import CardDataStats from "./CardDataStats";
import { SingleInputDateRangeWithTimePicker } from "../ui/date-picker-with-range";
import { fetchSummaries } from "@/lib/actions/dashboard-action";
import SummaryResponse from "@/types/dashboard/type";
import { BadgeDollarSign, BadgePercent, ChartLine, ChartNoAxesCombined, ChartPie, CreditCard, DollarSign, Scale, ShoppingCart } from "lucide-react";
import SolidItemsCard from "@/components/dashboard/Chat/ChatCard";
import TableOne from "./Tables/TableOne";
import { fetchOrders } from "@/lib/actions/order-actions";
import { Orders } from "@/types/orders/type";

const PaymentMethod = dynamic(() => import("@/components/dashboard/Charts/ChartThree"), {
  ssr: false,
});
const Dashboard: React.FC = () => {
  const [summaries, setSummaries] = useState<SummaryResponse | null>(null);
  const [orders, setOrders] = useState<Orders[]>([]);

  useEffect(() => {
    const getSummaries = async () => {
      try {
        const [summary, orders] = await Promise.all([fetchSummaries(), fetchOrders()]);
        console.log(summary);
        setSummaries(summary as SummaryResponse);
        setOrders(orders);
      } catch (error) {
        console.error("Error fetching summaries:", error);
      }
    };

    getSummaries();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
        </div>
        <SingleInputDateRangeWithTimePicker setSummaries={setSummaries as React.Dispatch<React.SetStateAction<SummaryResponse>>} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6  xl:grid-cols-4 2xl:gap-7.5 bg-white p-3 rounded-lg shadow-default">
        <CardDataStats
          title="Total Revenue"
          total={`TSH ${summaries ? Intl.NumberFormat().format(summaries.totalRevenue) : "0.00"}`}>
          <DollarSign />
        </CardDataStats>
        <CardDataStats title="Total Sales" total={` ${summaries ? Intl.NumberFormat().format(summaries.salesCount) : "0.00"}`}>
          <BadgeDollarSign />
        </CardDataStats>
        <CardDataStats title="Average Sale" total={`TZS ${summaries ? Intl.NumberFormat().format(summaries.averageSale) : "0.00"}`}>
          <BadgeDollarSign />
        </CardDataStats>
        <CardDataStats title="Discount" total={`TSH ${summaries ? Intl.NumberFormat().format(summaries.discounts) : "0.00"}`}>
          <BadgePercent />
        </CardDataStats>

      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6  xl:grid-cols-4 2xl:gap-7.5 bg-white p-3 rounded-lg shadow-default">

        <CardDataStats title="Expenses" total={`TSH ${summaries ? Intl.NumberFormat().format(summaries.expense) : "0.00"}`}>
          <CreditCard />
        </CardDataStats>
        <CardDataStats title="Total Orders" total={`${summaries ? Intl.NumberFormat().format(summaries.totalOrders) : "0.00"}`}>
          <ShoppingCart />
        </CardDataStats>
        <CardDataStats title="Completed Orders" total={`${summaries ? Intl.NumberFormat().format(summaries.completedOrders) : "0.00"}`}>
          <ShoppingCart />
        </CardDataStats>
        <CardDataStats title="Pending Orders" total={`${summaries ? Intl.NumberFormat().format(summaries.pendingOrders) : "0.00"}`}>
          <ShoppingCart />
        </CardDataStats>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6  xl:grid-cols-4 2xl:gap-7.5 bg-white p-3 rounded-lg shadow-default">

        <CardDataStats title="Gross Profit" total={`TSH ${summaries ? Intl.NumberFormat().format(summaries.grossProfit) : "0.00"}`}>
          <ChartNoAxesCombined />
        </CardDataStats>
        <CardDataStats title="Gross Sale" total={`${summaries ? Intl.NumberFormat().format(summaries.grossSales) : "0.00"}`}>
          <ChartLine />
        </CardDataStats>
        <CardDataStats title="Gross Profit Margin" total={`${summaries ? Intl.NumberFormat().format(summaries.margins) : "0.00"} %`}>
          <ChartPie />
        </CardDataStats>
        <CardDataStats title="Closing Balance" total={`${summaries ? Intl.NumberFormat().format(summaries.closingBalance) : "0.00"}`}>
          <Scale />
        </CardDataStats>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        {/* <ChartOne /> */}
        {/* <ChartTwo /> */}
        <PaymentMethod paymentChannels={summaries ? summaries.paymentMethodTotals : []} />
        {/*<MapOne />*/}
        <div className="col-span-12 xl:col-span-8">
          <TableOne orders={orders} />
        </div>
        <SolidItemsCard SoldItems={summaries ? summaries.soldItems : []} />
      </div>
    </div>
  );
};

export default Dashboard;
