'use client';
import React, { useState, useEffect } from 'react';
import { Edit, Building} from 'lucide-react';
import { getWarehouse} from '@/lib/actions/warehouse/list-warehouse';
import { Warehouses } from '@/types/warehouse/warehouse/type';
import Loading from '@/app/(protected)/loading';
import { Button } from '@/components/ui/button';
import { warehouseInvoices } from '@/lib/actions/warehouse/subscription';
import WarehouseInvoiceTable from '@/components/widgets/warehouse/invoice-table';
import { useRouter } from 'next/navigation';



const WarehouseInvoice = () => {
  const [warehouse, setWarehouse] = useState<Warehouses>();
 
  const [loading, setLoading] = useState(true);
  const router = useRouter()

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getWarehouse();
        if (data) {
          setWarehouse(data);
          
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWarehouses();
  }, []);

  
const fetchWarehouseInvoices = async (page: number, pageSize: number, searchQuery: string) => {

  const response = await warehouseInvoices(page, pageSize, searchQuery);
  
  return {
    content: response.content,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
    size: response.size,
    number: response.number,
    first: response.first,
    last: response.last,
    numberOfElements: response.numberOfElements,
    empty: response.empty
  };
};

  const handleEditWarehouse = () => {
   router.push(`/warehouse-profile/${warehouse?.id}`)
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!warehouse) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-12">
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No warehouse selected</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 mt-12">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex lg:flex-row lg:justify-between lg:items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {warehouse.name}
              </h1>
              <div className="hidden lg:flex items-center text-sm text-gray-500">
                <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs lg:text-sm font-medium ${
                  warehouse.subscriptionStatus === 'OK' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {warehouse.subscriptionStatus === 'OK' ? 'Active' : 'Inactive'}
                </span>
                
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleEditWarehouse}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
             
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
      <WarehouseInvoiceTable
        warehouseId={warehouse.id}
        fetchInvoices={fetchWarehouseInvoices}
        onInvoiceSelect={(invoice) => {
          console.log('Selected invoice:', invoice);
        }}
      />
    </div>
      
    </div>
  );
};

export default WarehouseInvoice;

