import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { StockIntake } from '@/types/stock-intake/type';

interface ExportButtonsProps {
  data: StockIntake[];
  filename?: string;
}

const TableExport: React.FC<ExportButtonsProps> = ({ 
  data, 
  filename = 'exported-data'
}) => {
  // Convert data to CSV format
  const convertToCSV = (data: StockIntake[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header as keyof StockIntake];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  // Convert data to Excel-compatible XML format
  const convertToExcel = (data: StockIntake[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => row[header as keyof StockIntake]).join('\t')
    ).join('\n');
    
    return `${headers.join('\t')}\n${rows}`;
  };

  // Generate PDF using browser's print functionality
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const headers = Object.keys(data[0]);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            table { 
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td { 
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
            }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${headers.map(header => `<td>${row[header as keyof StockIntake]}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
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

  // Handler functions for different export types
  const handleCSVDownload = () => {
    const csvContent = convertToCSV(data);
    downloadFile(csvContent, 'text/csv', 'csv');
  };

  const handleExcelDownload = () => {
    const excelContent = convertToExcel(data);
    downloadFile(excelContent, 'application/vnd.ms-excel', 'xls');
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
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleExcelDownload}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Excel
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        Print/PDF
      </Button>
    </div>
  );
};

export default TableExport;