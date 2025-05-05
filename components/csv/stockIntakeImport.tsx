'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";
import React from "react";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useCSVUpload } from "@/hooks/uploadStockIntake";

// Validation Function
const validateCSV = (
  fileContent: string,
  expectedHeaders: string[]
): { isValid: boolean; errors: string[]; rows: string[][] } => {
  // Split into lines and remove empty lines
  const lines = fileContent.split("\n").filter(Boolean);
  
  // Initial parsing and trimming of all cells
  const rows: string[][] = lines.map(line => 
    line.split(",").map(cell => {
      // Remove leading/trailing spaces and normalize multiple spaces to single space
      return cell.trim().replace(/\s+/g, ' ');
    })
  );

  const errors: string[] = [];

  if (rows.length === 0) {
    return { isValid: false, errors: ["The file is empty."], rows: [] };
  }

  // Validate headers
  const headers = rows[0];
  const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    return { isValid: false, errors: [`Missing required headers: ${missingHeaders.join(", ")}`], rows: [] };
  }

  // Validate rows
  rows.slice(1).forEach((row, rowIndex) => {
    const rowErrors: string[] = [];
    const currentRowIndex = rowIndex + 2; // Adjusting for 1-based index with headers

    // Required Field Validation
    const requiredFields = ["Stock Name", "Stock Variant Name", "Value", "Quantity","Identifier"];
    requiredFields.forEach((field) => {
      const fieldIndex = headers.indexOf(field);
      if (fieldIndex !== -1 && (!row[fieldIndex] || row[fieldIndex].trim() === "")) {
        rowErrors.push(`Row ${currentRowIndex}: "${field}" cannot be empty.`);
      }
    });

    // Specific Field Validation
    const quantityIndex = headers.indexOf("Quantity");
    if (quantityIndex !== -1) {
      const quantity = parseFloat(row[quantityIndex]);
      if (isNaN(quantity) || quantity < 0) {
        rowErrors.push(`Row ${currentRowIndex}: "Quantity" cannot be less than zero.`);
      }
    }

    const valueIndex = headers.indexOf("Value");
    if (valueIndex !== -1) {
      const value = parseInt(row[valueIndex], 10);
      if (isNaN(value) || value < 0) {
        rowErrors.push(`Row ${currentRowIndex}: "Value" cannot be less than zero.`);
      }
    }

    // Date format validation (YYYY-MM-DD)
    const expiryDateIndex = headers.indexOf("Expiry Date");
    if (expiryDateIndex !== -1) {
      const expiryDate = row[expiryDateIndex];
      if (expiryDate && expiryDate.trim() !== "") {
        // Check for YYYY-MM-DD format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
          rowErrors.push(`Row ${currentRowIndex}: "Expiry Date" must be in YYYY-MM-DD format.`);
        } else {
          // Validate that it's a valid date
          const dateParts = expiryDate.split('-');
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1; // JavaScript months are 0-indexed
          const day = parseInt(dateParts[2], 10);
          const date = new Date(year, month, day);
          
          if (
            date.getFullYear() !== year || 
            date.getMonth() !== month || 
            date.getDate() !== day
          ) {
            rowErrors.push(`Row ${currentRowIndex}: "Expiry Date" is not a valid date.`);
          }
        }
      }
    }

    //identifier is uuid
    const identifierIndex = headers.indexOf("Identifier");
    if (identifierIndex !== -1) {
      const identifier = row[identifierIndex];
      if (identifier && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier)) {
        rowErrors.push(`Row ${currentRowIndex}: "Identifier" must be a valid UUID.`);
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    }
  });

  return { isValid: errors.length === 0, errors, rows };
};

export function CSVStockIntakeDialog() {
  const expectedHeaders = [
    "Stock Name",
    "Stock Variant Name",
    "Value",
    "Quantity",
    "Expiry Date",
    "Identifier"
  ];

  const [fileContent, setFileContent] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    rows: string[][];
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isUploading, uploadProgress, error, uploadCSV } = useCSVUpload();

  // Reset upload complete state when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setUploadComplete(false), 300); // Delay to ensure animation completes
    }
  }, [isOpen]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      try {
        const fileText = await selectedFile.text();
        const result = validateCSV(fileText, expectedHeaders);

        if (result.isValid) {
          const cleanedCSV = result.rows
            .map(row => row.join(','))
            .join('\n');

          setValidationResult(result);
          setFile(selectedFile);
          setFileContent(cleanedCSV); 
        } else {
          setValidationResult(result);
          setFile(selectedFile);
          setFileContent(null);
        }
      } catch (error) {
        console.error("Error processing file:", error);
        setValidationResult({
          isValid: false,
          errors: ["Failed to process the file. Please check the file format."],
          rows: []
        });
      }
    }
  };

  const handleUpload = async () => {
    if (file && fileContent && validationResult?.isValid) {
      try {
        await uploadCSV({ 
          fileData: fileContent, 
          fileName: file.name 
        });
        setUploadComplete(true);
        
        // Close dialog with slight delay to show success state
        setTimeout(() => {
          resetForm();
          setIsOpen(false);
        }, 1500);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const handleTemplateDownload = () => {
    fetch("/csv/stock-template.csv")
      .then((res) => {
        if (res.ok) {
          window.open("/csv/stock-template.csv", "_blank");
        } else {
          alert("Template not found");
        }
      })
      .catch(() => alert("Failed to download template"));
  };

  const resetForm = () => {
    setFile(null);
    setFileContent(null);
    setValidationResult(null);
    setUploadComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isUploading) {
        setIsOpen(open);
        if (!open) resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button
          className="h-10 gap-1 dark:bg-white dark:text-black-2"
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
        >
          <Icon className="h-3.5 w-3.5" icon="mdi:file-import" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap text-black-2 dark:bg-white">Import Stock</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Upload Stock CSV</DialogTitle>
          <DialogDescription>
            Select a CSV file to upload. Please ensure that the file is formatted correctly with all required headers.
            Note: Expiry Date must be in YYYY-MM-DD format.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!isUploading && !uploadComplete && (
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                id="csv"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full"
                disabled={isUploading}
              />
              <Button 
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  resetForm();
                }}
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                disabled={!file || isUploading}
              >
                Clear
              </Button>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive" className="border-red-500">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {uploadComplete && (
            <Alert className="bg-green-50 border-green-500">
              <Check className="h-4 w-4 text-green-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your stock data has been uploaded successfully!</AlertDescription>
            </Alert>
          )}
          
          {isUploading && (
            <div className="space-y-2 py-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
              <Progress 
                value={uploadProgress} 
                className="w-full h-2 bg-gray-200" 
                style={{
                  "--progress-background": "linear-gradient(to right, #10b981, #059669)"
                } as React.CSSProperties}
              />
              <p className="text-sm text-gray-600">Please do not close this window</p>
            </div>
          )}
          
          {validationResult?.errors && validationResult.errors.length > 0 && !isUploading && (
            <div className="border border-red-300 rounded-md p-3 bg-red-50">
              <h3 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult?.rows && validationResult.rows.length > 0 && !isUploading && (
            <div className="overflow-auto max-h-60 border rounded-md">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {validationResult.rows[0]?.map((header, index) => (
                      <th key={index} className="border px-3 py-2 text-left text-sm font-medium text-gray-700">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validationResult.rows.slice(1).map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      <tr className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="border px-3 py-2 text-sm text-gray-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                      {validationResult.errors
                        .filter((error) => error.includes(`Row ${rowIndex + 2}`))
                        .map((error, errorIndex) => (
                          <tr key={`error-${rowIndex}-${errorIndex}`} className="bg-red-50">
                            <td
                              colSpan={row.length}
                              className="border px-3 py-1 text-red-600 text-sm"
                            >
                              {error}
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <DialogFooter className="space-x-2">
          {!isUploading && !uploadComplete && (
            <>
              <Button onClick={handleTemplateDownload} variant="outline" size="sm" className="gap-1">
                <Icon className="h-4 w-4" icon="mdi:file-download" />
                Download Template
              </Button>
              <Button
                type="submit"
                onClick={handleUpload}
                disabled={!file || !(validationResult?.isValid) || isUploading}
                className="gap-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Icon className="h-4 w-4" icon="mdi:cloud-upload" />
                    Upload CSV
                  </>
                )}
              </Button>
            </>
          )}
          {uploadComplete && (
            <Button onClick={() => setIsOpen(false)} className="gap-1">
              <Check className="h-4 w-4" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}