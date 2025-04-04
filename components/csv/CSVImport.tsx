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
import React from "react";
import { useCSVUpload } from "@/hooks/uploadProduct";
import { Progress } from "../ui/progress";
import { Upload } from "lucide-react";

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
    return { 
      isValid: false, 
      errors: [`Missing required headers: ${missingHeaders.join(", ")}`], 
      rows: [] 
    };
  }

  // Get column indexes for validation
  // const productNameIndex = headers.indexOf("Product Name");
  // const categoryNameIndex = headers.indexOf("Category Name");
  // const variantNameIndex = headers.indexOf("Variant Name");
  const priceIndex = headers.indexOf("Price");

  // Validate rows
  rows.slice(1).forEach((row, rowIndex) => {
    const currentRowIndex = rowIndex + 2; // Adjusting for 1-based index and header row

    // Required Field Validation
    const requiredFields = ["Product Name", "Category Name", "Variant Name", "Price"];
    requiredFields.forEach((field) => {
      const fieldIndex = headers.indexOf(field);
      if (fieldIndex !== -1 && (!row[fieldIndex] || row[fieldIndex].trim() === "")) {
        errors.push(`Row ${currentRowIndex}: "${field}" cannot be empty`);
      }
    });

    // Price Validation
    if (priceIndex !== -1) {
      const price = row[priceIndex]?.trim();
      if (price) {
        if (!/^\d+$/.test(price)) {
          errors.push(
            `Row ${currentRowIndex}: Price "${price}" must be a whole number without decimals or special characters`
          );
        } else if (parseInt(price) <= 0) {
          errors.push(
            `Row ${currentRowIndex}: Price must be greater than 0`
          );
        }
      }
    }
  });

  return { 
    isValid: errors.length === 0, 
    errors, 
    rows 
  };
};

export function ProductCSVDialog() {
  const expectedHeaders = [
    "Product Name",
    "Category Name",
    "Variant Name",
    "Price",
    "SKU",
    "Barcode",
    "Department"
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

  const { uploadProgress, error, uploadCSV } = useCSVUpload();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      try {
        const fileText = await selectedFile.text();
        const result = validateCSV(fileText, expectedHeaders);

        // If validation passes, convert cleaned rows back to CSV format
        if (result.isValid) {
          const cleanedCSV = result.rows
            .map(row => row.join(','))
            .join('\n');

          setValidationResult(result);
          setFile(selectedFile);
          setFileContent(cleanedCSV); // Store the cleaned CSV content
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
          fileData: fileContent, // This now contains the cleaned CSV data
          fileName: file.name 
        });
        resetForm();
        setIsOpen(false);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };
  const handleTemplateDownload = () => {
    fetch("/csv/product-csv-template.csv")
      .then((res) => {
        if (res.ok) {
          window.open("/csv/product-csv-template.csv", "_blank");
        } else {
          alert("Template not found");
        }
      })
      .catch(() => alert("Failed to download template"));
  };

  // const handleUpload = async () => {
  //   if (file && fileContent && validationResult?.isValid) {
  //     try {
  //       await uploadCSV({ fileData: fileContent, fileName: file.name });
  //       resetForm();
  //       setIsOpen(false);
  //     } catch (error) {
  //       console.error("Error uploading file:", error);
  //     }
  //   }
  // };

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
          className="h-10 gap-1 bg-white dark:bg-black dark:text-white border border-black dark:border-gray-600"
          size="sm"
          variant="default"
          onClick={() => setIsOpen(true)}
        >
          <Upload className="h-4 w-4 text-black hover:text-white" />
          <span className="text-black hover:text-white" >Import CSV</span>
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
            {uploadProgress > 0 && (
            <div className="mt-4 h-4 bg-emerald-500">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-600">{uploadProgress}% uploaded</p>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
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
