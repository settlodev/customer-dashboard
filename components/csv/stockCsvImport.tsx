'use client';

import { useState, useRef } from "react";
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
import { uploadStockCSV } from "@/lib/actions/stock-actions";

// Validation Function
const validateCSV = (
  fileContent: string,
  expectedHeaders: string[]
): { isValid: boolean; errors: string[]; rows: string[][] } => {
  const lines = fileContent.split("\n").map((line) => line.trim()).filter(Boolean);
  const rows: string[][] = lines.map((line) => line.split(",").map((col) => col.trim()));
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
    const requiredFields = ["Stock Name", "Stock Variant Name", "starting Quantity", "starting Value", "Alert Level"];
    requiredFields.forEach((field) => {
      const fieldIndex = headers.indexOf(field);
      if (fieldIndex !== -1 && (!row[fieldIndex] || row[fieldIndex].trim() === "")) {
        rowErrors.push(`Row ${currentRowIndex}: "${field}" cannot be empty.`);
      }
    });

    // Specific Field Validation
    const startingQuantityIndex = headers.indexOf("Starting Quantity");
    if (startingQuantityIndex !== -1) {
      const startingQuantity = parseFloat(row[startingQuantityIndex]);
      if (isNaN(startingQuantity) || startingQuantity < 0) {
        rowErrors.push(`Row ${currentRowIndex}: "Starting Quantity" cannot be less than zero.`);
      }
    }

    const startingValueIndex = headers.indexOf("Starting Value");
    if (startingValueIndex !== -1) {
      const startingValue = parseInt(row[startingValueIndex], 10);
      if (isNaN(startingValue) || startingValue < 0) {
        rowErrors.push(`Row ${currentRowIndex}: "Starting Value" cannot be less than zero.`);
      }
    }

    const alertLevelIndex = headers.indexOf("Alert Level");
    if (alertLevelIndex !== -1) {
      const alertLevel = parseInt(row[alertLevelIndex], 10);
      if (isNaN(alertLevel) || alertLevel < 0) {
        rowErrors.push(`Row ${currentRowIndex}: "Alert Level" cannot be less than zero.`);
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    }
  });

  return { isValid: errors.length === 0, errors, rows };
};

export function CSVStockDialog() {
  const expectedHeaders = [
    "Stock Name",
    "Stock Variant Name",
    "Starting Quantity",
    "Starting Value",
    "Alert Level",
  ];

  const [fileContent, setFileContent] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    rows: string[][];
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileText = await selectedFile.text();
      const result = validateCSV(fileText, expectedHeaders);
      setValidationResult(result);
      setFile(selectedFile);
      setFileContent(fileText);
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

  const handleUpload = async () => {
    if (file && fileContent && validationResult?.isValid) {
      try {
        await uploadStockCSV({ fileData: fileContent, fileName: file.name });
        resetForm();
        setIsOpen(false);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const resetForm = () => {
    setFile(null);
    setFileContent(null);
    setValidationResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="h-8 gap-1"
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
        >
          <Icon className="h-3.5 w-3.5" icon="mdi:file-import" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Upload CSV</DialogTitle>
          <DialogDescription>
            Select a CSV file to upload. Please ensure that the file is formatted correctly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            ref={fileInputRef}
            id="csv"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full"
          />
          {validationResult?.rows && (
            <div className="overflow-auto max-h-60">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                  {validationResult?.rows?.length > 0 && validationResult.rows[0]?.map((header, index) => (
  <th key={index} className="border px-2 py-1 bg-gray-100">
    {header}
  </th>
))}


                  </tr>
                </thead>
                <tbody>
                  {validationResult.rows.slice(1).map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      <tr>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="border px-2 py-1">
                            {cell}
                          </td>
                        ))}
                      </tr>
                      {validationResult.errors
                        .filter((error) => error.includes(`Row ${rowIndex + 2}`))
                        .map((error, errorIndex) => (
                          <tr key={`error-${rowIndex}-${errorIndex}`}>
                            <td
                              colSpan={row.length}
                              className="border px-2 py-1 text-red-500 text-sm"
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
        <DialogFooter>
          <Button onClick={handleTemplateDownload} variant="outline" size="sm" className="gap-1">
            Download Template
          </Button>
          <Button
            type="submit"
            onClick={handleUpload}
            disabled={!file || !(validationResult?.isValid)}
          >
            Upload CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
