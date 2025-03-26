import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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

interface ExportButtonsProps {
  data: Product[];
  filename?: string;
}

const TableExport: React.FC<ExportButtonsProps> = ({ 
  data, 
  filename = 'exported-data'
}) => {
  console.log('data', data)
  // Convert data to CSV format with specific columns and variant handling
  const convertToCSV = (data: Product[]): string => {
    if (data.length === 0) return '';
    
    // Specific columns to export
    const headers = [
      'Product Name', 
      'Category Name', 
      'Department Name', 
      'Quantity', 
      'Variant Name', 
      'Variant Available in Stock',
      'Variant Purchasing Price', 
      'Variant Selling Price',
      'Variant Barcode'
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
              product.departmentName,
              product.quantity,
              '',
              '',
              ''
            ].map(escapeCSVValue).join(',')
          ];
        }

        // Create a row for each variant
        return product.variants.map(variant => {
          return [
            product.name,
            product.categoryName,
            product.departmentName,
            product.quantity,
            variant.name,
            variant.availableStock,
            variant.purchasingPrice,
            variant.price,
            variant.barcode
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

  // Download handler function
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
  
  const handleCSVDownload = () => {
    const csvContent = convertToCSV(data);
    downloadFile(csvContent, 'text/csv', 'csv');
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCSVDownload}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        CSV
      </Button>
    </div>
  );
};

export default TableExport;