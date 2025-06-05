import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadProductsCSV } from '@/lib/actions/product-actions';

interface Variant {
  id: string;
  name: string;
  availableStock: number;
  purchasingPrice: number;
  price: number;
  barcode: string;
}

interface Product {
  id: string;
  name: string;
  departmentName: string;
  categoryName: string;
  quantity: number;
  variants: Variant[];
}

interface TableExportProps {
  data?: Product[];
  filename?: string;
  locationId?: string;
  useEndpoint?: boolean;
}

const TableExport: React.FC<TableExportProps> = ({
  data = [],
  filename = 'exported-data',
  locationId,
  useEndpoint = true
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Convert data to CSV format with specific columns and variant handling
  const convertToCSV = (data: Product[]): string => {
    if (data.length === 0) return '';

    // Specific columns to export matching the endpoint format
    const headers = [
      'Product Name',
      'Category Name',
      'Variant Name',
      'Price',
      'SKU',
      'Unit',
      'Barcode',
      'Department'
    ];

    // Create CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...data.flatMap(product => {
        // If no variants, create a row with empty variant fields
        if (product.variants.length === 0) {
          return [
            [
              product.name,
              product.categoryName,
              '',
              '',
              '',
              '',
              '',
              product.departmentName
            ].map(escapeCSVValue).join(',')
          ];
        }

        // Create a row for each variant
        return product.variants.map(variant => {
          return [
            product.name,
            product.categoryName,
            variant.name,
            variant.price,
            '', // SKU (empty)
            '', // Unit (empty)
            variant.barcode,
            product.departmentName
          ].map(escapeCSVValue).join(',');
        });
      })
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

  // Improved endpoint download handler
  const handleEndpointDownload = async () => {
    try {
      setIsLoading(true);
      const response = await downloadProductsCSV(locationId);

      if (response) {
        if (response instanceof Blob) {
          const url = URL.createObjectURL(response);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (typeof response === 'string') {
          downloadFile(response, 'text/csv', 'csv');
        } else {
          console.error("Unexpected response format", response);
          alert("Failed to process the downloaded data. Please try again later.");
        }
      } else {
        throw new Error("No CSV data received from server");
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

export default TableExport;