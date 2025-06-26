import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { StockIntake } from '@/types/stock-intake/type';
import { downloadStockIntakeCSV } from '@/lib/actions/stock-intake-actions';

interface TableExportProps {
  data?: StockIntake[];
  filename?: string;
  locationId?: string;
  useEndpoint?: boolean;
}

const StockIntakeExport: React.FC<TableExportProps> = ({ 
  data = [], 
  filename = 'exported-data',
  locationId,
  useEndpoint = true
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Convert data to CSV format with specific columns and variant handling
  const convertToCSV = (data: StockIntake[]): string => {
    if (data.length === 0) return '';
    
    // Add a note at the top of the CSV indicating the identifier column should not be modified
    const csvNote = '# IMPORTANT: The "identifier" column contains system IDs and should not be modified.';
    
    // Specific columns to export matching the endpoint format
    const headers = [
      'Stock Name', 
      'Stock Variant Name', 
      'Value', 
      'Quantity', 
      'Expiry Date', 
      'identifier (DO NOT EDIT)'  // Renamed to emphasize it should not be edited
    ];

    // Create rows
    const csvRows = [
      csvNote,
      headers.join(','), // Header row
      ...data.map(intake => {
        // Format date if it exists
        const expiryDate = intake.batchExpiryDate 
          ? new Date(intake.batchExpiryDate).toISOString().split('T')[0] // Format as YYYY-MM-DD
          : '';
        
        return [
          intake.stockName || '', // Stock/Product Name
          intake.stockVariantName || '', // Variant Name
          intake.value?.toString() || '0', // Starting Value
          intake.quantity?.toString() || '0', // Starting Quantity  
          expiryDate, // Expiry Date
          `[ID:${intake.id || ''}]` // Format ID in a way that makes it clear it's a system identifier
        ].map(escapeCSVValue).join(',');
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
    
    // Escape quotes and wrap in quotes if value contains comma or quote
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
      const response = await downloadStockIntakeCSV(locationId);
      
      // The response might be in different formats depending on your API implementation
      let csvData;
      
      if (response) {
        if (typeof response === 'string') {
          
          csvData = '# IMPORTANT: The "identifier" column contains system IDs and should not be modified.\n' + response;
          downloadFile(csvData, 'text/csv', 'csv');
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

export default StockIntakeExport;