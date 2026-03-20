"use client";
import React from "react";

const accountingProviders = [
  {
    name: "Xero",
    description: "Cloud accounting for small business",
    logo: (
      <svg viewBox="0 0 512 512" className="w-8 h-8" fill="none">
        <rect width="512" height="512" rx="96" fill="#13B5EA" />
        <g transform="translate(128, 128) scale(0.5)">
          <path
            d="M181.5 256L52.7 125.2c-8.5-8.5-8.5-22.3 0-30.8 8.5-8.5 22.3-8.5 30.8 0L212.3 223.2 341.1 94.4c8.5-8.5 22.3-8.5 30.8 0 8.5 8.5 8.5 22.3 0 30.8L242.7 254.4 371.5 383.2c8.5 8.5 8.5 22.3 0 30.8-4.3 4.3-9.9 6.4-15.4 6.4s-11.1-2.1-15.4-6.4L212.3 285.6 83.5 414.4c-4.3 4.3-9.9 6.4-15.4 6.4s-11.1-2.1-15.4-6.4c-8.5-8.5-8.5-22.3 0-30.8L181.5 256z"
            fill="white"
          />
        </g>
      </svg>
    ),
  },
  {
    name: "QuickBooks",
    description: "Accounting & bookkeeping software",
    logo: (
      <svg viewBox="0 0 512 512" className="w-8 h-8" fill="none">
        <rect width="512" height="512" rx="96" fill="#2CA01C" />
        <g transform="translate(140, 100)">
          <path
            d="M48 156c0-59.6 48.4-108 108-108 16.4 0 32 3.6 46 10.2V0h44v312c-13.6 6.4-29.2 10-46 10-59.6 0-108-48.4-108-108h-44v-58zm108-64c-35.3 0-64 28.7-64 64s28.7 64 64 64 64-28.7 64-64-28.7-64-64-64z"
            fill="white"
          />
        </g>
      </svg>
    ),
  },
];

export default function AccountingIntegrations() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {accountingProviders.map((provider) => (
        <div
          key={provider.name}
          className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex flex-col justify-between opacity-50 pointer-events-none select-none"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              {provider.logo}
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {provider.name}
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              {provider.description}
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Coming Soon
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
