'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React, { useState } from 'react'

import WarehouseStockReport from './stock-report'
import UnimplementedTabContent from './helper'
import StockRequestReport from './stock-request-report'
import Loading from '@/app/(protected)/loading'
import SupplierCreditReport from './supplier-credit-report'

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
  const [isLoading,] = useState<boolean>(false)
  const [hasError,] = useState<boolean>(false)
  
  const tabs: TabData[] = [
    {
      name: "Stock Report",
      value: "stock",
      implemented: true
    },
    {
      name: "Request Report",
      value: "request", 
      implemented: true
    },
   
    {
      name:"Supplier credit Report",
      value:"credit",
      implemented:true
    }
    
  ]



  
  if (hasError) {
    return <div>Error occurred. Please try again.</div>
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Reports Dashboard</h2>
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
          <div>
            <Loading />
          </div>
        ) : (
          tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.implemented ? (
                <>
                  {tab.value === "stock" && <WarehouseStockReport />}
                  {tab.value === "request" && <StockRequestReport />}
                  {tab.value === "credit" && <SupplierCreditReport/>}
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