
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
// Optionally import router if using Next.js
// import { useRouter } from "next/navigation";

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
     // "Expiry Date"
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

// Helper to validate numeric fields
const validateNumericField = (
  value: string, 
  fieldName: string, 
  config: { min: number; allowZero: boolean },
  rowIndex: number
): string | null => {
  const num = parseFloat(value);
  
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


const validateCSV = (
  fileContent: string,
  config = CSV_CONFIG
): ValidationResult => 
  {
  // Parse the CSV
  const lines = fileContent.trim().split("\n").filter(Boolean);
  const rows: string[][] = lines.map(line => 
    line.split(",").map(cell => cell.trim().replace(/\s+/g, ' '))
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

  // Duplicate check: Product Name + Variant Name + Stock Name + Stock Variant Name (as an example)
const duplicateCheckMap = new Map<string, number[]>();

rows.slice(1).forEach((row, i) => {
  const rowIndex = i + 2; // +2 to account for headers + 0-index

  const productName = row[headers.indexOf("Product Name")]?.toLowerCase().trim();
  const variantName = row[headers.indexOf("Variant Name")]?.toLowerCase().trim();
  const stockName = row[headers.indexOf("Stock Name")]?.toLowerCase().trim();
  const stockVariantName = row[headers.indexOf("Stock Variant Name")]?.toLowerCase().trim();

  const key = `${productName}-${variantName}-${stockName}-${stockVariantName}`;

  if (!duplicateCheckMap.has(key)) {
    duplicateCheckMap.set(key, [rowIndex]);
  } else {
    duplicateCheckMap.get(key)!.push(rowIndex);
  }
});

// Collect duplicate keys
duplicateCheckMap.forEach((indexes, key) => {
  if (indexes.length > 1) {
    errors.push(
      `Duplicate entries found in rows: ${indexes.join(", ")} for combination: ${key.replaceAll("-", " / ")}`
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
        if (emojiRegex.test(row[fieldIndex])) {
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

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    }
  });


  return { isValid: errors.length === 0, errors, rows };
};




type TaskStatus = 'idle' | 'processing' | 'complete' | 'failed' | 'error';

export function ProductWithStockCSVDialog() {
  // State Management
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Task status states
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [taskMessage, setTaskMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [backgroundProcessing, setBackgroundProcessing] = useState(false);

  // Hook for CSV upload
  const {uploadProgress, error, uploadCSV, isUploading } = useCSVUpload();
  
  // Reset form function
  const resetForm = () => {
    setFile(null);
    setFileContent(null);
    setValidationResult(null);
    setTaskId(null);
    setTaskStatus('idle');
    setTaskMessage(null);
    setIsPolling(false);
    setShouldRedirect(false);
    setBackgroundProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle successful upload and refresh
  const handleSuccessfulUpload = () => {
    setIsOpen(false);
    resetForm();
    window.location.reload();
  };

  // Effect for task status polling
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const pollTaskStatus = async () => {
      if (!taskId || !isPolling) return;

      try {
        const status = await checkTaskStatus(taskId);
        
        setTaskStatus(status.csv_upload_status as TaskStatus);
        setTaskMessage(status.message);

        if (status.csv_upload_status === "complete" || status.csv_upload_status === "failed") {
          setIsPolling(false);
          if (pollingInterval) clearInterval(pollingInterval);
          
          // Handle completion scenarios
          if (status.csv_upload_status === "complete") {
            toast({
              title: "Upload Successful",
              description: "Your products and stock have been successfully uploaded.",
              variant: "default",
            });
            
            if (shouldRedirect) {
              window.location.href = "/stocks";
            } else if (backgroundProcessing) {
              // Just notify, don't navigate
            } else {
              handleSuccessfulUpload();
            }
          } else {
            toast({
              title: "Upload Failed",
              description: status.message || "There was an error processing your upload.",
              variant: "destructive",
            });
          }
        }
      } catch (error : any) {
        console.error("Error checking task status:", error);
        setTaskStatus("error");
        setTaskMessage("Failed to check task status");
        setIsPolling(false);
        if (pollingInterval) clearInterval(pollingInterval);
        
        toast({
          title: "Error",
          description: "Failed to check task status. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (taskId && isPolling) {
      // Initial check
      pollTaskStatus();
      
      // Set up polling interval (every 2.5 seconds)
      pollingInterval = setInterval(pollTaskStatus, 2500);
    }

    // Cleanup function
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [taskId, isPolling, shouldRedirect, backgroundProcessing, toast]);

  // File handling
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

  // Upload handling
  const handleUpload = async () => {
    if (file && fileContent && validationResult?.isValid) {
      try {
        const response = await uploadCSV({ fileData: fileContent, fileName: file.name });
      
        if (response && response.task_id) {
          setTaskId(response.task_id);
          setIsPolling(true);
          setTaskStatus("processing");
          
          toast({
            title: "Upload Started",
            description: "Your file is being processed. This may take a moment.",
          });
        } else {
          console.error("No task ID returned from upload");
          setTaskStatus("error");
          setTaskMessage("Failed to start task");
          
          toast({
            title: "Upload Error",
            description: "Failed to start the upload process. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setTaskStatus("error");
        setTaskMessage("Upload failed");
        
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

  // Dialog close handling
  const handleClose = () => {
    // If we're in the middle of processing, show confirmation
    if (taskStatus === 'processing' && !backgroundProcessing) {
      setShowConfirmClose(true);
      return;
    }
    
    resetForm();
    setIsOpen(false);
  };

  // Background processing
  const handleBackgroundProcessing = () => {
    setBackgroundProcessing(true);
    setIsOpen(false);
    
    toast({
      title: "Processing in Background",
      description: "Your upload will continue processing. You can continue working.",
    });
    
    window.location.reload();
  };

  // Redirect handling
  const handleRedirectToStocks = () => {
    if (taskStatus === "complete") {
      window.location.href = "/stocks";
    } else {
      setShouldRedirect(true);
      
      if (taskStatus === 'processing') {
        handleBackgroundProcessing();
      }
    }
  };

  // Product count for display
  const productCount = validationResult?.rows?.length ? validationResult.rows.length - 1 : 0;

  // Error display component
  const ErrorList = ({ errors }: { errors: string[] }) => {
    if (errors.length === 0) return null;
    
    // Group errors by row for better display
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

  return (
    <>
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
          <DialogHeader>
            <DialogTitle>Import Stock with Products</DialogTitle>
            <DialogDescription>
              Select a CSV file to upload. Please ensure that the file matches the expected format.
            </DialogDescription>
          </DialogHeader>

          {taskStatus === "complete" ? (
            <div className="py-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:check-circle" className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-green-600 mb-2">Upload Successful!</h3>
              <p className="text-gray-600 mb-4">
                Your products and stock have been successfully uploaded. You can close this dialog or go to the stocks page.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => {
                  handleClose();
                  window.location.reload(); // Refresh the page
                }} variant="outline">
                  Close & Refresh
                </Button>
                <Button onClick={handleRedirectToStocks}>
                  Go to Stocks
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                {taskStatus === "processing" ? (
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
                    <div className="mt-4 flex justify-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleBackgroundProcessing}
                      >
                        Continue in background
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShouldRedirect(true);
                          handleBackgroundProcessing();
                        }}
                      >
                        Process and go to Stocks
                      </Button>
                    </div>
                  </div>
                ) : taskStatus === "failed" || taskStatus === "error" ? (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center justify-center mb-4">
                      <Icon icon="mdi:alert-circle" className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-center text-red-700">
                      {taskMessage || "Failed to process stock upload. Please try again."}
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button onClick={resetForm} variant="outline">
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {validationResult?.isValid && productCount > 0 && taskStatus === 'idle' && (
                <div className="text-sm text-green-600 font-medium pt-2 flex items-center">
                  <Icon icon="mdi:check-circle" className="h-4 w-4 mr-1 text-green-500" />
                  You&rsquo;re uploading a total of <strong className="mx-1">{productCount}</strong> products with stock.
                </div>
              )}

              <DialogFooter>
                {taskStatus === "processing" ? (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBackgroundProcessing} 
                      variant="outline"
                    >
                      Continue in background
                    </Button>
                    <Button disabled>
                      <span className="mr-2">
                        <span className="animate-spin inline-block h-4 w-4 border-b-2 border-white rounded-full"></span>
                      </span>
                      Processing...
                    </Button>
                  </div>
                ) : taskStatus === "failed" || taskStatus === "error" ? (
                  <Button onClick={resetForm} variant="outline">
                    Try Again
                  </Button>
                ) : (
                  <>
                    <SubmitButton
                      label="Upload CSV"
                      isPending={isUploading}
                      isDisabled={!file || !(validationResult?.isValid) || isUploading}
                      onClick={handleUpload}
                    />
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog for closing during processing */}
      <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              Your upload is still processing. If you close this dialog, processing will continue in the background.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowConfirmClose(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => {
              setShowConfirmClose(false);
              handleBackgroundProcessing();
            }}>
              Continue in Background
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
