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

const formatTime = (time: string) => {
  const date = new Date(time);
  return `${date.getHours()}:${date.getMinutes()}`;
};

const ChartOne: React.FC<salesProp> = ({ salesStats }) => {
  console.log("salesStats", salesStats );
  const periodicSalesValues: periodicSalesValues[] = salesStats.periodicSalesValues || [];

  const categories = periodicSalesValues.map((sale) => formatTime(sale.time));
  const data = periodicSalesValues.map((sale) => sale.totalPaidAmount);

  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#3C50E0"],
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
        text: "Time",
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
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-primary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-primary"></span>
            </span>
            <div className="w-full">
              <p className="text-lg font-medium">Periodic Sales</p>
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
            height={350}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartOne;
