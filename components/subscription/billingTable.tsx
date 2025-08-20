
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { searchInvoices } from '@/lib/actions/invoice-actions';

import { useToast } from '@/hooks/use-toast';
import { Invoice } from '@/types/invoice/type';

interface BillingHistoryTableProps {
  className?: string;
  locationId?: string 
}

const BillingHistoryTable: React.FC<BillingHistoryTableProps> = ({ className, locationId }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  const { toast } = useToast();

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchInvoices = useCallback(async (page: number = 1, search: string = '') => {
    setLoading(true);
    try {
      const response = await searchInvoices(search, page, itemsPerPage, locationId);
      setInvoices(response.content);
      setTotalPages(response.totalPages || 1);
      setTotalItems(response.totalElements || 0);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [locationId, itemsPerPage, toast]); 


  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  
  useEffect(() => {
    setCurrentPage(1); 
  }, [debouncedSearchTerm]);


  useEffect(() => {
    fetchInvoices(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm, fetchInvoices]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'FAILED': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'overdue': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getInvoiceDescription = (invoice: Invoice) => {
    if (invoice.locationSubscriptions?.length > 0) {
      const subscriptionNames = invoice.locationSubscriptions
        .map(sub => sub.subscriptionPackageName)
        .join(', ');
      return `Subscription: ${subscriptionNames}`;
    }
    return 'Invoice';
  };

  const getInvoiceItems = (invoice: Invoice) => {
    if (invoice.locationSubscriptions?.length > 0) {
      return invoice.locationSubscriptions.map(sub => 
        `${sub.subscriptionPackageName} (${sub.numberOfMonths} month${sub.numberOfMonths > 1 ? 's' : ''})`
      );
    }
    return ['No items'];
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <Card className={`border-t-4 border-t-purple-500 ${className || ''}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center text-xl">
              <FileText className="mr-2" size={24} />
              Billing History
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all your invoices and payment records
            </p>
          </div>
          
          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading invoices...</span>
          </div>
        )}

        {/* Bills Table */}
        {!loading && (
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Invoice ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Description</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        <FileText className="mx-auto mb-2" size={48} />
                        <p>No invoices found matching your criteria</p>
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 font-mono text-sm font-medium">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2 text-gray-400" />
                            {formatDate(invoice.dateCreated)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium">{getInvoiceDescription(invoice)}</p>
                            <p className="text-xs text-gray-500">
                              {getInvoiceItems(invoice).join(', ')}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-semibold">
                          TZS {invoice.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.locationInvoiceStatus)}`}
                          >
                            {invoice.locationInvoiceStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm">{invoice.locationName || 'N/A'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BillingHistoryTable;