import { PaymentMethods } from "@/types/dashboard/type";
import { ApexOptions } from "apexcharts";
import React from "react";
import ReactApexChart from "react-apexcharts";

type PaymentChannelState = {
  paymentChannels: PaymentMethods[];
}

const options: ApexOptions = {
  chart: {
    fontFamily: "Satoshi, sans-serif",
    type: "donut",
  },
  colors: ['#50BE97', '#F2B988', '#D7D3C9', '#B28DBF'],
  labels: [],
  legend: {
    show: false,
    position: "bottom",
  },
  plotOptions: {
    pie: {
      donut: {
        size: "65%",
        background: "transparent",
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  responsive: [
    {
      breakpoint: 2600,
      options: {
        chart: {
          width: 380,
        },
      },
    },
    {
      breakpoint: 640,
      options: {
        chart: {
          width: 200,
        },
      },
    },
  ],
};

const PaymentMethod: React.FC<PaymentChannelState> = ({ paymentChannels }) => {
  const series = paymentChannels.map((item) => item.amount);
  const labels = paymentChannels.map((item) => item.paymentMethodName);

  const updatedOptions: ApexOptions = {
    ...options,
    labels,
  };

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="mb-3 flex justify-between gap-4 sm:flex">
        <h5 className="text-xl font-semibold text-black dark:text-white">Payment Channels</h5>
      </div>

      <div className="mb-2">
        <div id="chartThree" className="mx-auto flex justify-center">
          {series.length > 0 ? (
            <ReactApexChart options={updatedOptions} series={series} type="donut" />
          ) : (
            <div className="flex items-center justify-center">
              {/* <span className="mr-2 animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></span> */}
              <span className="text-gray-500">No data available</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start justify-start gap-y-3">
        {paymentChannels.map((item, index) => (
          <div className="max-w-full sm:w-1/2" key={index}>
            <div className="flex w-full items-center">
              <span
                className="mr-2 block h-3 w-full max-w-3 rounded-full"
                style={{
                  backgroundColor: options.colors?.[index % options.colors.length] || "#000",
                }}
              ></span>
              <p className="flex w-full justify-between text-sm font-medium text-black dark:text-white gap-3">
                <span>{item.paymentMethodName}</span>:
                <span>{Intl.NumberFormat().format(item.amount)}/=</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethod;
