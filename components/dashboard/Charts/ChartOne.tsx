"use client";

import { ApexOptions } from "apexcharts";
import React from "react";
import dynamic from "next/dynamic";
import { periodicSalesValues, salesStats } from "@/types/dashboard/type";

interface salesProp {
  salesStats: salesStats;
}

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const generateHourlySlots = () => {
  const slots = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0); // Start at 12:00 AM
  for (let i = 0; i < 24; i++) {
    const slot = new Date(start);
    slot.setHours(i);
    slots.push(slot);
  }
  return slots;
};

const mergeSalesDataWithSlots = (sales: periodicSalesValues[]) => {
  const slots = generateHourlySlots();
  const salesMap = new Map(
    sales.map((sale) => [new Date(sale.time).getHours(), sale])
  );

  return slots.map((slot) => {
    const hour = slot.getHours();
    return (
      salesMap.get(hour) || {
        time: slot.toISOString(),
        totalPaidAmount: 0,  // Fill with 0 if no sales data
      }
    );
  });
};

const formatTime = (time: string) => {
  const date = new Date(time);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const ChartOne: React.FC<salesProp> = ({ salesStats }) => {
  const mergedSales = mergeSalesDataWithSlots(salesStats.periodicSalesValues || []);

  const categories = mergedSales.map((sale) => formatTime(sale.time));
  const data = mergedSales.map((sale) => sale.totalPaidAmount);

  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#10B981"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      height: 335,
      type: "line",
      dropShadow: {
        enabled: true,
        color: "#623CEA14",
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      title: {
        text: "Time in 24-hour format",
      },
      categories: categories,
      type: "category",
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: "Total Paid Amount",
      },
    },
    stroke: {
      width: 2,
      curve: "smooth",
    },
    dataLabels: {
      enabled: false,
    },
  };

  const amount = [
    {
      name: "Total Paid Amount",
      data: data,
    },
  ];

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          <div className="flex min-w-47.5">
            <div className="w-full flex flex-col">
              <p className="text-lg font-medium">Periodic Sales</p>
              <p className="text-sm font-normal">Hourly Sales Performance</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div id="chartOne" className="-ml-5">
          <ReactApexChart
            options={options}
            series={amount}
            type="line"
            height={370}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartOne;
