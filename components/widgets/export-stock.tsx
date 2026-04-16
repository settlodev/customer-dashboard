import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadStockCSV } from '@/lib/actions/stock-actions';
import type { StockVariant } from "@/types/stock/type";

interface TableExportProps {
  data?: StockVariant[];
  filename?: string;
  // locationId?: string;
  useEndpoint?: boolean;
  exportType: 'warehouse' | 'location';
}

const StockExport: React.FC<TableExportProps> = ({ 
  data = [], 
  filename = 'stock-data',
  // locationId,
  useEndpoint = true,
  exportType
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Convert data to CSV format with specific columns for stock data
  const convertToCSV = (data: StockVariant[]): string => {
    if (data.length === 0) return '';
    
    // Specific columns to export matching the endpoint format
    const headers = [
      'Name',
      'Display Name',
      'SKU',
      'Unit',
      'Conversion',
      'Barcode',
    ];

    const csvRows = [
      headers.join(','),
      ...data.map(stock => [
        stock.name || '',
        stock.displayName || '',
        stock.sku || '',
        stock.unitAbbreviation || '',
        stock.conversionToBase?.toString() || '1',
        stock.barcode || '',
      ].map(escapeCSVValue).join(',')),
    ];
    
    return csvRows.join('\n');
  };

  // Escape CSV values
  const escapeCSVValue = (value: any): string => {
    // Convert to string
    const stringValue = value !== null && value !== undefined 
      ? String(value) 
      : '';
    
    // Escape quotes and wrap in quotes if value contains comma
    if (stringValue.includes(',') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  // Download handler function for local data
  const downloadFile = (content: string, fileType: string, fileExtension: string) => {
    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Handle direct endpoint download
  const handleEndpointDownload = async () => {
    try {
      setIsLoading(true);
      const response = await downloadStockCSV();
      let csvData;
      
      if (response) {
        if (typeof response === 'string') {
          csvData = response;
        } else if (response instanceof Blob) {
          const url = URL.createObjectURL(response);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setIsLoading(false);
          return; // Exit early as we've handled the download
        } else {
          console.error("Unexpected response format", response);
          setIsLoading(false);
          return;
        }
      } else {
        throw new Error("No CSV data received from server");
      }

      // Create a blob and trigger download for string response
      if (csvData) {
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to download CSV:", error);
      alert("Failed to download CSV. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle local data conversion and download
  const handleLocalDataDownload = () => {
    const csvContent = convertToCSV(data);
    downloadFile(csvContent, 'text/csv', 'csv');
  };

  // Main download handler that decides which method to use
  const handleDownload = () => {
    if (useEndpoint) {
      handleEndpointDownload();
    } else {
      handleLocalDataDownload();
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="flex items-center gap-2"
        disabled={isLoading}
      >
        <Download className="h-4 w-4" />
        {isLoading ? 'Downloading...' : 'Export to CSV'}
      </Button>
    </div>
  );
};

export default StockExport;