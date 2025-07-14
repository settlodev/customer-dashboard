'use client';
import React, { useState, useEffect } from 'react';
import { Edit, MapPin, Phone, Mail, Clock, Building, Calendar } from 'lucide-react';
import { getWarehouse} from '@/lib/actions/warehouse/list-warehouse';
import { Warehouses } from '@/types/warehouse/warehouse/type';
import Loading from '@/app/(protected)/loading';
import { Button } from '@/components/ui/button';
import { warehouseInvoices } from '@/lib/actions/warehouse/subscription';
import WarehouseInvoiceTable from '@/components/widgets/warehouse/invoice-table';



const WarehouseProfile = () => {
  const [warehouse, setWarehouse] = useState<Warehouses>();
 
  const [loading, setLoading] = useState(true);

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

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEditWarehouse = () => {
    // console.log('Edit warehouse:', selectedWarehouse?.id);
    // Add your edit logic here
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900">{warehouse.phone}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{warehouse.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Location</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-900">{warehouse.address}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {warehouse.city}
                  {warehouse.region && `, ${warehouse.region}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Operating Hours</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Hours</p>
                <p className="text-gray-900">
                  {formatTime(warehouse.openingTime)} - {formatTime(warehouse.closingTime)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Date Created</p>
                <p className="text-gray-900">{formatDate(warehouse.dateCreated)}</p>
              </div>
            </div>
            {warehouse.description && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-900">{warehouse.description}</p>
              </div>
            )}
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

export default WarehouseProfile;