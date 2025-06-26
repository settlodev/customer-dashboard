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
import { useCSVUpload } from "@/hooks/upload";
import { checkTaskStatus } from "@/lib/actions/stock-actions";
import SubmitButton from "../widgets/submit-button";
import { useToast } from "@/hooks/use-toast";

// CSV Header and Validation Configuration
const CSV_CONFIG = {
  expectedHeaders: [
    "Product Name",
    "Category Name",
    "Variant Name",
    "Price",
    "SKU",
    "Barcode",
    "Department",
    "Stock Name",
    "Stock Variant Name",
    "Starting Quantity",
    "Starting Value",
    "Alert Level",
    "Expiry Date"
  ],
  requiredFields: [
    "Product Name", 
    "Category Name", 
    "Variant Name", 
    "Price", 
    "Quantity", 
    "Stock Name", 
    "Stock Variant Name", 
    "Starting Quantity", 
    "Starting Value", 
    "Alert Level"
  ],
  textFields: [
    "Product Name", 
    "Category Name", 
    "Stock Name", 
    "Stock Variant Name", 
    "Variant Name"
  ],
  numericFields: {
    "Price": { min: 0.01, allowZero: false },
    "Starting Quantity": { min: 0, allowZero: true },
    "Starting Value": { min: 0, allowZero: true },
    "Alert Level": { min: 0, allowZero: true }
  }
};

// Validation Types
type ValidationResult = {
  isValid: boolean;
  errors: string[];
  rows: string[][];
};

type TaskStatus = 'idle' | 'processing' | 'complete' | 'failed' | 'error';

// Dialog view states
type DialogView = 'upload' | 'processing' | 'success' | 'error' | 'confirm-close';

// Helper to validate numeric fields
const validateNumericField = (
  value: string, 
  fieldName: string, 
  config: { min: number; allowZero: boolean },
  rowIndex: number
): string | null => {
  const trimmedValue = value.trim();
  const num = parseFloat(trimmedValue);
  
  if (isNaN(num)) {
    return `Row ${rowIndex}: "${fieldName}" must be a valid number.`;
  }
  
  if (!config.allowZero && num <= 0) {
    return `Row ${rowIndex}: "${fieldName}" must be greater than zero.`;
  }
  
  if (config.allowZero && num < 0) {
    return `Row ${rowIndex}: "${fieldName}" cannot be less than zero.`;
  }
  
  return null;
};

const validateDateField = (
  value: string,
  fieldName: string,
  rowIndex: number
): string | null => {
  const trimmedValue = value.trim(); 
  if (!trimmedValue) return null; 
  
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(trimmedValue)) {
    return `Row ${rowIndex}: "${fieldName}" should be in YYYY-MM-DD format if filled.`;
  }
  
  const date = new Date(trimmedValue);
  if (isNaN(date.getTime())) {
    return `Row ${rowIndex}: "${fieldName}" is not a valid date.`;
  }
  
  return null;
};

const validateCSV = (
  fileContent: string,
  config = CSV_CONFIG
): ValidationResult => {
  const lines = fileContent.trim().split("\n").filter(Boolean);
  const rows: string[][] = lines.map(line => 
    line.split(",").map(cell => cell.trim())
  );

  const errors: string[] = [];

  if (rows.length === 0) {
    return { isValid: false, errors: ["The file is empty."], rows: [] };
  }

  if (rows.length === 1) {
    return { isValid: false, errors: ["The file only contains headers but no data."], rows };
  }

  const emojiRegex = /[\u{1F300}-\u{1F9FF}|\u{2700}-\u{27BF}|\u{2600}-\u{26FF}|\u{2300}-\u{23FF}|\u{2000}-\u{206F}|\u{FE00}-\u{FE0F}]/gu;
  
  const headers = rows[0];
  const missingHeaders = config.expectedHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    return { 
      isValid: false, 
      errors: [`Missing required headers: ${missingHeaders.join(", ")}`], 
      rows 
    };
  }

  // Duplicate checking
  const productDuplicates = new Map<string, number[]>();
  const stockDuplicates = new Map<string, number[]>();

  const productNameIndex = headers.indexOf("Product Name");
  const variantNameIndex = headers.indexOf("Variant Name");
  const stockNameIndex = headers.indexOf("Stock Name");
  const stockVariantNameIndex = headers.indexOf("Stock Variant Name");

  rows.slice(1).forEach((row, i) => {
    const rowIndex = i + 2;

    const productName = row[productNameIndex]?.trim().toLowerCase();
    const variantName = row[variantNameIndex]?.trim().toLowerCase();
    const productKey = `${productName}|||${variantName}`;

    if (!productDuplicates.has(productKey)) {
      productDuplicates.set(productKey, [rowIndex]);
    } else {
      productDuplicates.get(productKey)!.push(rowIndex);
    }

    const stockName = row[stockNameIndex]?.trim().toLowerCase();
    const stockVariantName = row[stockVariantNameIndex]?.trim().toLowerCase();
    const stockKey = `${stockName}|||${stockVariantName}`;

    if (!stockDuplicates.has(stockKey)) {
      stockDuplicates.set(stockKey, [rowIndex]);
    } else {
      stockDuplicates.get(stockKey)!.push(rowIndex);
    }
  });

  productDuplicates.forEach((indexes, key) => {
    if (indexes.length > 1) {
      const [productName, variantName] = key.split('|||');
      errors.push(
        `🔄 Product Section - Duplicate entries found in rows: ${indexes.join(", ")} for Product: "${productName}" + Variant: "${variantName}"`
      );
    }
  });

  stockDuplicates.forEach((indexes, key) => {
    if (indexes.length > 1) {
      const [stockName, stockVariantName] = key.split('|||');
      errors.push(
        `📦 Stock Section - Duplicate entries found in rows: ${indexes.join(", ")} for Stock: "${stockName}" + Stock Variant: "${stockVariantName}"`
      );
    }
  });

  rows.slice(1).forEach((row, rowIndex) => {
    const rowErrors: string[] = [];
    const currentRowIndex = rowIndex + 2; 
    
    if (row.length !== headers.length) {
      rowErrors.push(`Row ${currentRowIndex}: Column count mismatch. Expected ${headers.length} columns, found ${row.length}.`);
    }

    config.textFields.forEach((field) => {
      const fieldIndex = headers.indexOf(field);
      if (fieldIndex !== -1 && row[fieldIndex]) {
        const trimmedValue = row[fieldIndex].trim();
        if (emojiRegex.test(trimmedValue)) {
          rowErrors.push(`Row ${currentRowIndex}: "${field}" contains emojis which are not allowed.`);
        }
      }
    });

    config.requiredFields.forEach((field) => {
      const fieldIndex = headers.indexOf(field);
      if (fieldIndex !== -1 && (!row[fieldIndex] || row[fieldIndex].trim() === "")) {
        rowErrors.push(`Row ${currentRowIndex}: "${field}" cannot be empty.`);
      }
    });

    Object.entries(config.numericFields).forEach(([field, validationConfig]) => {
      const fieldIndex = headers.indexOf(field);
      if (fieldIndex !== -1 && row[fieldIndex]) {
        const error = validateNumericField(
          row[fieldIndex], 
          field, 
          validationConfig,
          currentRowIndex
        );
        if (error) rowErrors.push(error);
      }
    });

    const expiryDateIndex = headers.indexOf("Expiry Date");
    if (expiryDateIndex !== -1 && row[expiryDateIndex]) {
      const dateError = validateDateField(
        row[expiryDateIndex],
        "Expiry Date",
        currentRowIndex
      );
      if (dateError) rowErrors.push(dateError);
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    }
  });

  return { isValid: errors.length === 0, errors, rows };
};

export function ProductWithStockCSVDialog() {
  const { toast } = useToast();
  
  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<DialogView>('upload');
  
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Task state
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [taskMessage, setTaskMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Upload hook
  const { uploadProgress, error, uploadCSV, isUploading } = useCSVUpload();
  
  // Reset function
  const resetForm = () => {
    setFile(null);
    setFileContent(null);
    setValidationResult(null);
    setTaskId(null);
    setTaskStatus('idle');
    setTaskMessage(null);
    setIsPolling(false);
    setCurrentView('upload');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Close handler with smart logic
  const handleClose = () => {
    if (taskStatus === 'processing') {
      setCurrentView('confirm-close');
      return;
    }
    
    setIsOpen(false);
    resetForm();
  };

  // Continue in background
  const handleBackgroundProcessing = () => {
    toast({
      title: "Processing in Background",
      description: "Your upload will continue processing. You can continue working.",
    });
    
    resetForm();
    setIsOpen(false);
    setTimeout(() => window.location.reload(), 300);
  };

  // Task status polling effect
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;
  
    const pollTaskStatus = async () => {
      if (!taskId || !isPolling) return;
  
      try {
        const status = await checkTaskStatus(taskId);
        
        setTaskStatus(status.csv_upload_status as TaskStatus);
        setTaskMessage(status.message);
  
        if (status.csv_upload_status === "complete") {
          setIsPolling(false);
          setCurrentView('success');
          if (pollingInterval) clearInterval(pollingInterval);
        } else if (status.csv_upload_status === "failed") {
          setIsPolling(false);
          setCurrentView('error');
          if (pollingInterval) clearInterval(pollingInterval);
        }
      } catch (error: any) {
        console.error("Error checking task status:", error);
        setTaskStatus("error");
        setTaskMessage("Failed to check task status");
        setIsPolling(false);
        setCurrentView('error');
        if (pollingInterval) clearInterval(pollingInterval);
      }
    };
  
    if (taskId && isPolling) {
      pollTaskStatus();
      pollingInterval = setInterval(pollTaskStatus, 2000);
    }
  
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [taskId, isPolling]);

  // File change handler
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      try {
        const fileText = await selectedFile.text();
        const result = validateCSV(fileText);

        setValidationResult(result);
        setFile(selectedFile);
        
        if (result.isValid) {
          const cleanedCSV = result.rows.map(row => row.join(',')).join('\n');
          setFileContent(cleanedCSV);
          
          toast({
            title: "File Validated",
            description: `Successfully validated ${result.rows.length - 1} products with stock.`,
            variant: "default",
          });
        } else {
          setFileContent(null);
          
          toast({
            title: "Validation Failed",
            description: `${result.errors.length} issues found. Please fix them before uploading.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error processing file:", error);
        setValidationResult({
          isValid: false,
          errors: ["Failed to process the file. Please check the file format."],
          rows: []
        });
        
        toast({
          title: "Error",
          description: "Failed to process the file. Please check the file format.",
          variant: "destructive",
        });
      }
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (file && fileContent && validationResult?.isValid) {      
      try {
        const response = await uploadCSV({ fileData: fileContent, fileName: file.name });
      
        if (response && response.task_id) {
          setTaskId(response.task_id);
          setIsPolling(true);
          setTaskStatus("processing");
          setCurrentView('processing');
          
          toast({
            title: "Upload Started",
            description: "Your file is being processed. This may take a moment.",
          });
        } else {
          throw new Error("No task ID returned from upload");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setTaskStatus("error");
        setTaskMessage("Upload failed");
        setCurrentView('error');
        
        toast({
          title: "Upload Failed",
          description: "There was an error uploading your file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Template download
  const handleTemplateDownload = () => {
    fetch("/csv/stock-template.csv")
      .then((res) => {
        if (res.ok) {
          window.open("/csv/ProductWithStock.csv", "_blank");
          toast({
            title: "Template Downloaded",
            description: "The CSV template has been downloaded.",
          });
        } else {
          toast({
            title: "Download Failed",
            description: "Template not found. Please try again.",
            variant: "destructive",
          });
        }
      })
      .catch(() => {
        toast({
          title: "Download Failed",
          description: "Failed to download template. Please try again.",
          variant: "destructive",
        });
      });
  };

  // Success handlers
  const handleSuccessClose = () => {
    toast({
      title: "Upload Successful",
      description: "Your products and stock have been successfully uploaded.",
    });
    
    resetForm();
    setIsOpen(false);
    setTimeout(() => window.location.reload(), 300);
  };

  const handleRedirectToStocks = () => {
    toast({
      title: "Upload Successful",
      description: "Redirecting to stocks page...",
    });
    setTimeout(() => {
      window.location.href = "/stocks";
    }, 1000);
  };

  // Product count
  const productCount = validationResult?.rows?.length ? validationResult.rows.length - 1 : 0;

  // Error display component
  const ErrorList = ({ errors }: { errors: string[] }) => {
    if (errors.length === 0) return null;
    
    const rowRegex = /Row (\d+):/;
    const errorsByRow: { [key: string]: string[] } = {};
    
    errors.forEach(error => {
      const match = error.match(rowRegex);
      const key = match ? `Row ${match[1]}` : 'General';
      errorsByRow[key] = errorsByRow[key] || [];
      errorsByRow[key].push(error);
    });
    
    return (
      <div className="mt-4 max-h-40 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3">
        <h4 className="font-medium text-red-800 mb-2">Validation Errors</h4>
        <ul className="space-y-1">
          {Object.entries(errorsByRow).map(([rowKey, rowErrors]) => (
            <li key={rowKey} className="mb-2">
              <span className="font-medium text-red-700">{rowKey}</span>
              <ul className="ml-4 list-disc">
                {rowErrors.map((err, idx) => (
                  <li key={idx} className="text-sm text-red-600">
                    {err.replace(rowRegex, '')}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Render different views based on current state
  const renderDialogContent = () => {
    switch (currentView) {
      case 'processing':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Processing Upload</DialogTitle>
              <DialogDescription>
                Your file is being processed. This may take a few moments.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <p className="text-center text-blue-700 mb-3">
                  Processing your stock upload. This may take a few moments...
                </p>
                <p className="text-center text-sm text-gray-500">
                  You can close this dialog and continue working. Your stock will be available shortly.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleBackgroundProcessing} variant="outline">
                Continue in Background
              </Button>
              <Button onClick={() => {
                handleBackgroundProcessing();
                setTimeout(() => {
                  window.location.href = "/stocks";
                }, 1000);
              }}>
                Process and Go to Stocks
              </Button>
            </DialogFooter>
          </>
        );

      case 'success':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Upload Successful!</DialogTitle>
              <DialogDescription>
                Your products and stock have been successfully uploaded.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:check-circle" className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-green-600 mb-2">Upload Complete!</h3>
              <p className="text-gray-600 mb-4">
                You can close this dialog or navigate to the stocks page to view your uploaded items.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleSuccessClose} variant="outline">
                Close & Refresh
              </Button>
              <Button onClick={handleRedirectToStocks}>
                Go to Stocks
              </Button>
            </DialogFooter>
          </>
        );

      case 'error':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Upload Failed</DialogTitle>
              <DialogDescription>
                There was an error processing your upload.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center justify-center mb-4">
                  <Icon icon="mdi:alert-circle" className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-center text-red-700">
                  {taskMessage || "Failed to process stock upload. Please try again."}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setCurrentView('upload')} variant="outline">
                Try Again
              </Button>
            </DialogFooter>
          </>
        );

      case 'confirm-close':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Processing in Progress</DialogTitle>
              <DialogDescription>
                Your upload is still being processed. What would you like to do?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">
                If you close this dialog, processing will continue in the background and you&apos;ll be able to see your uploaded stock shortly.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setCurrentView('processing')} variant="outline">
                Keep Dialog Open
              </Button>
              <Button onClick={handleBackgroundProcessing}>
                Continue in Background
              </Button>
            </DialogFooter>
          </>
        );

      default: // 'upload'
        return (
          <>
            <DialogHeader>
              <DialogTitle>Import Stock with Products</DialogTitle>
              <DialogDescription>
                Select a CSV file to upload. Please ensure that the file matches the expected format.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="csv" className="text-sm font-medium">
                    CSV File
                  </label>
                  <Button 
                    onClick={handleTemplateDownload} 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1 text-xs"
                  >
                    <Icon icon="mdi:file-download" className="h-3.5 w-3.5" />
                    Download Template
                  </Button>
                </div>
                <Input
                  ref={fileInputRef}
                  id="csv"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  The CSV file should include columns for Product Name, Category, Variants, Price, and Stock information.
                </p>
              </div>
              
              {validationResult && !validationResult.isValid && (
                <ErrorList errors={validationResult.errors} />
              )}
              
              {validationResult?.rows && validationResult.rows.length > 0 && (
                <div className="overflow-auto max-h-60 rounded-md border border-gray-200">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        {validationResult.rows[0]?.map((header, index) => (
                          <th key={index} className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {validationResult.rows.slice(1, 6).map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {validationResult.rows.length > 6 && (
                        <tr>
                          <td colSpan={validationResult.rows[0].length} className="px-3 py-2 text-sm text-gray-500 italic text-center">
                            {validationResult.rows.length - 6} more rows not shown
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {uploadProgress > 0 && (
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Uploading...</span>
                    <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  {uploadProgress < 100 ? (
                    <p className="text-xs text-gray-500">Please wait while your file uploads...</p>
                  ) : (
                    <p className="text-xs text-emerald-600">Upload complete! Processing data...</p>
                  )}
                </div>
              )}
              
              {error && (
                <div className="p-2 rounded-md bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {validationResult?.isValid && productCount > 0 && (
                <div className="text-sm text-green-600 font-medium pt-2 flex items-center">
                  <Icon icon="mdi:check-circle" className="h-4 w-4 mr-1 text-green-500" />
                  You&rsquo;re uploading a total of <strong className="mx-1">{productCount}</strong> products with stock.
                </div>
              )}
            </div>
            <DialogFooter>
              <SubmitButton
                label="Upload CSV"
                isPending={isUploading}
                isDisabled={!file || !(validationResult?.isValid) || isUploading}
                onClick={handleUpload}
              />
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      } else {
        setIsOpen(true);
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
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap text-black-2 dark:bg-white dark:text-black-2">
            Import CSV (Stock & Product)
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] lg:max-w-[1000px]">
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}