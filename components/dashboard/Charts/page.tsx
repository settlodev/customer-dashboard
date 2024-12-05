"use client";
import ChartOne from "@/components/dashboard/Charts/ChartOne";
import ChartTwo from "@/components/dashboard/Charts/ChartTwo";
import dynamic from "next/dynamic";
import React from "react";

const PaymentMethod = dynamic(() => import("@/components/dashboard/Charts/ChartThree"), {
  ssr: false,
});

const Chart: React.FC = () => {
  return (
    <>

      <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
        <ChartOne />
        <ChartTwo />
        <PaymentMethod paymentChannels={[]} />
      </div>
    </>
  );
};

export default Chart;
