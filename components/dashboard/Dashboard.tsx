"use client";
import React, { useEffect, useState } from "react";
import { DateRangePicker } from "../ui/date-picker-with-range";
import { fetchSummaries } from "@/lib/actions/dashboard-action";
import SummaryResponse from "@/types/dashboard/type";
import { fetchOrders } from "@/lib/actions/order-actions";
import { Orders } from "@/types/orders/type";
import Loading from "@/app/loading";
import SalesDashboard from "./salesDashboard";


const Dashboard: React.FC = () => {
  const [summaries, setSummaries] = useState<SummaryResponse | null>(null);
  const [,setOrders] = useState<Orders[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const getSummaries = async () => {
      try {
        const [summary, orders] = await Promise.all([fetchSummaries(), fetchOrders()]);
        setSummaries(summary as SummaryResponse);
        setOrders(orders);
        // console.log("Summaries and orders are as follow:", summary);
      } catch (error) {
        console.error("Error fetching summaries:", error);
      }
      finally {
        setIsLoading(false);
      }
    };

    getSummaries();
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
    <div className="flex flex-col gap-6">
      <div className="flex justify-between p-1 mt-6">
        <div>
        </div>
        <DateRangePicker setSummaries={setSummaries as React.Dispatch<React.SetStateAction<SummaryResponse>>} />
      </div>
    
      <SalesDashboard salesData={summaries} />
    </div>
  );
};

export default Dashboard;
