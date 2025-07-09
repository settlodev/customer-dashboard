'use client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download } from 'lucide-react'
import React, { useState } from 'react'
import DatePicker from '../datepicker'
// import PurchaseReportComponent from './reports/PurchaseReportComponent'
// import RequestReportComponent from './reports/RequestReportComponent'

import WarehouseStockReport from './stock-report'
import UnimplementedTabContent from './helper'
// import LoadingCard from './reports/LoadingCard'
// import ErrorCard from './reports/ErrorCard'

// Types for API response
export interface StockHistory {
  totalStockIntakes: number
  totalStockRemaining: number
  totalEstimatedProfit: number
  totalStockValue: number
  lowStockItems: LowStockItem[]
  outOfStockItems: OutOfStockItem[]
}

export interface LowStockItem {
  stockName: string
  stockVariantName: string
  remainingAmount: number
}

export interface OutOfStockItem {
  stockName: string
  stockVariantName: string
}

// Tab configuration
type TabData = {
  name: string
  value: string
  implemented: boolean
}

function DashboardLayout() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasError,] = useState<boolean>(false)
  
  const tabs: TabData[] = [
    {
      name: "Stock Report",
      value: "stock",
      implemented: true
    },
    {
      name: "Purchase Report", 
      value: 'purchase',
      implemented: false
    },
    {
      name: "Request Report",
      value: "request", 
      implemented: false
    },
    {
      name: "Consumption",
      value: "consumption",
      implemented: false
    },
    {
      name: "Valuation",
      value: "valuation", 
      implemented: false
    }
  ]

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleExport = () => {
    const currentDate = new Date().toISOString().split('T')[0]
    const filename = `inventory-report-${currentDate}.csv`
    alert(`Exporting report as ${filename}`)
  }
  if (hasError) {
    return <div>Error occurred. Please try again.</div>
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Reports Dashboard</h2>
        <div className='flex gap-4'>
          <DatePicker 
            selectedDate={selectedDate} 
            onDateChange={handleDateChange}
          />
          <Button 
            className='flex gap-2' 
            variant="outline"
            onClick={handleExport}
          >
            <Download className='w-4 h-4'/>
            Export Report
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={tabs[0].value} className="w-full">
        <TabsList className="mb-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="capitalize">
              {tab.name}
              {!tab.implemented && (
                <span className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">Soon</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.implemented ? (
                <>
                  {tab.value === "stock" && <WarehouseStockReport />}
                  {/* {tab.value === "purchase" && <PurchaseReportComponent />}
                  {tab.value === "request" && <RequestReportComponent />} */}
                </>
              ) : (
                <UnimplementedTabContent tabName={tab.name} />
              )}
            </TabsContent>
          ))
        )}
      </Tabs>
    </div>
  )
}

export default DashboardLayout