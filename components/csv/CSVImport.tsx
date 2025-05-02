// 'use client';

// import { useState, useRef } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import React from "react";
// import { useCSVUpload } from "@/hooks/uploadProduct";
// import { Progress } from "../ui/progress";
// import { Upload } from "lucide-react";

// // Validation Function
// const validateCSV = (
//   fileContent: string,
//   expectedHeaders: string[]
// ): { isValid: boolean; errors: string[]; rows: string[][] } => {
//   // Split into lines and remove empty lines
//   const lines = fileContent.split("\n").filter(Boolean);
  
//   // Initial parsing and trimming of all cells
//   const rows: string[][] = lines.map(line => 
//     line.split(",").map(cell => {
//       // Remove leading/trailing spaces and normalize multiple spaces to single space
//       return cell.trim().replace(/\s+/g, ' ');
//     })
//   );

//   const errors: string[] = [];

//   if (rows.length === 0) {
//     return { isValid: false, errors: ["The file is empty."], rows: [] };
//   }

//   // Validate headers
//   const headers = rows[0];
//   const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));
//   if (missingHeaders.length > 0) {
//     return { 
//       isValid: false, 
//       errors: [`Missing required headers: ${missingHeaders.join(", ")}`], 
//       rows: [] 
//     };
//   }

//   // Get column indexes for validation
//   // const productNameIndex = headers.indexOf("Product Name");
//   // const categoryNameIndex = headers.indexOf("Category Name");
//   // const variantNameIndex = headers.indexOf("Variant Name");
//   const priceIndex = headers.indexOf("Price");

//   // Validate rows
//   rows.slice(1).forEach((row, rowIndex) => {
//     const currentRowIndex = rowIndex + 2; // Adjusting for 1-based index and header row

//     // Required Field Validation
//     const requiredFields = ["Product Name", "Category Name", "Variant Name", "Price"];
//     requiredFields.forEach((field) => {
//       const fieldIndex = headers.indexOf(field);
//       if (fieldIndex !== -1 && (!row[fieldIndex] || row[fieldIndex].trim() === "")) {
//         errors.push(`Row ${currentRowIndex}: "${field}" cannot be empty`);
//       }
//     });

//     // Price Validation
//     if (priceIndex !== -1) {
//       const price = row[priceIndex]?.trim();
//       if (price) {
//         if (!/^\d+$/.test(price)) {
//           errors.push(
//             `Row ${currentRowIndex}: Price "${price}" must be a whole number without decimals or special characters`
//           );
//         } else if (parseInt(price) <= 0) {
//           errors.push(
//             `Row ${currentRowIndex}: Price must be greater than 0`
//           );
//         }
//       }
//     }
//   });

//   return { 
//     isValid: errors.length === 0, 
//     errors, 
//     rows 
//   };
// };

// export function ProductCSVDialog() {
//   const expectedHeaders = [
//     "Product Name",
//     "Category Name",
//     "Variant Name",
//     "Price",
//     "SKU",
//     "Barcode",
//     "Department"
//   ];

//   const [fileContent, setFileContent] = useState<string | null>(null);
//   const [file, setFile] = useState<File | null>(null);
//   const [validationResult, setValidationResult] = useState<{
//     isValid: boolean;
//     errors: string[];
//     rows: string[][];
//   } | null>(null);
//   const [isOpen, setIsOpen] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const { uploadProgress, error, uploadCSV } = useCSVUpload();

//   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = event.target.files?.[0];

//     if (selectedFile) {
//       try {
//         const fileText = await selectedFile.text();
//         const result = validateCSV(fileText, expectedHeaders);

//         // If validation passes, convert cleaned rows back to CSV format
//         if (result.isValid) {
//           const cleanedCSV = result.rows
//             .map(row => row.join(','))
//             .join('\n');

//           setValidationResult(result);
//           setFile(selectedFile);
//           setFileContent(cleanedCSV); // Store the cleaned CSV content
//         } else {
//           setValidationResult(result);
//           setFile(selectedFile);
//           setFileContent(null);
//         }
//       } catch (error) {
//         console.error("Error processing file:", error);
//         setValidationResult({
//           isValid: false,
//           errors: ["Failed to process the file. Please check the file format."],
//           rows: []
//         });
//       }
//     }
//   };

//   const handleUpload = async () => {
//     if (file && fileContent && validationResult?.isValid) {
//       try {
//         await uploadCSV({ 
//           fileData: fileContent, // This now contains the cleaned CSV data
//           fileName: file.name 
//         });
//         resetForm();
//         setIsOpen(false);
//       } catch (error) {
//         console.error("Error uploading file:", error);
//       }
//     }
//   };
//   const handleTemplateDownload = () => {
//     fetch("/csv/product-csv-template.csv")
//       .then((res) => {
//         if (res.ok) {
//           window.open("/csv/product-csv-template.csv", "_blank");
//         } else {
//           alert("Template not found");
//         }
//       })
//       .catch(() => alert("Failed to download template"));
//   };

//   // const handleUpload = async () => {
//   //   if (file && fileContent && validationResult?.isValid) {
//   //     try {
//   //       await uploadCSV({ fileData: fileContent, fileName: file.name });
//   //       resetForm();
//   //       setIsOpen(false);
//   //     } catch (error) {
//   //       console.error("Error uploading file:", error);
//   //     }
//   //   }
//   // };

//   const resetForm = () => {
//     setFile(null);
//     setFileContent(null);
//     setValidationResult(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         <Button
//           className="h-10 gap-1 bg-white dark:bg-black dark:text-white border border-black dark:border-gray-600"
//           size="sm"
//           variant="default"
//           onClick={() => setIsOpen(true)}
//         >
//           <Upload className="h-4 w-4 text-black hover:text-white" />
//           <span className="text-black hover:text-white" >Import CSV</span>
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="w-[90vw] lg:max-w-[1000px]">
//         <DialogHeader>
//           <DialogTitle>Upload CSV</DialogTitle>
//           <DialogDescription>
//             Select a CSV file to upload. Please ensure that the file is formatted correctly.
//           </DialogDescription>
//         </DialogHeader>
//         <div className="grid gap-4 py-4">
//           <Input
//             ref={fileInputRef}
//             id="csv"
//             type="file"
//             accept=".csv"
//             onChange={handleFileChange}
//             className="w-full"
//           />
//           {validationResult?.rows && (
//             <div className="overflow-auto max-h-60">
//               <table className="min-w-full border-collapse border border-gray-300">
//                 <thead>
//                   <tr>
                    

//                       {validationResult?.rows?.length > 0 && validationResult.rows[0]?.map((header, index) => (
//                       <th key={index} className="border px-2 py-1 bg-gray-100">
//                         {header}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {validationResult.rows.slice(1).map((row, rowIndex) => (
//                     <React.Fragment key={rowIndex}>
//                       <tr>
//                         {row.map((cell, cellIndex) => (
//                           <td key={cellIndex} className="border px-2 py-1">
//                             {cell}
//                           </td>
//                         ))}
//                       </tr>
//                       {validationResult.errors
//                         .filter((error) => error.includes(`Row ${rowIndex + 2}`))
//                         .map((error, errorIndex) => (
//                           <tr key={`error-${rowIndex}-${errorIndex}`}>
//                             <td
//                               colSpan={row.length}
//                               className="border px-2 py-1 text-red-500 text-sm"
//                             >
//                               {error}
//                             </td>
//                           </tr>
//                         ))}
//                     </React.Fragment>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//             {uploadProgress > 0 && (
//             <div className="mt-4 h-4 bg-emerald-500">
//               <Progress value={uploadProgress} className="w-full" />
//               <p className="text-sm text-gray-600">{uploadProgress}% uploaded</p>
//             </div>
//           )}
//           {error && <p className="text-red-500 text-sm">{error}</p>}
//         </div>
//         <DialogFooter>
//         <Button onClick={handleTemplateDownload} variant="outline" size="sm" className="gap-1">
//             Download Template
//           </Button>
//           <Button
//             type="submit"
//             onClick={handleUpload}
//             disabled={!file || !(validationResult?.isValid)}
//           >
//             Upload CSV
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }


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
import React from "react";
import { useCSVUpload } from "@/hooks/uploadProduct";
import { Progress } from "../ui/progress";
import { AlertCircle, Check, Loader2, Upload, Download, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Validation Function
const validateCSV = (
  fileContent: string,
  expectedHeaders: string[]
): { isValid: boolean; errors: string[]; warnings: string[]; rows: string[][] } => {
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
  const warnings: string[] = [];

  if (rows.length === 0) {
    return { isValid: false, errors: ["The file is empty."], warnings: [], rows: [] };
  }

  // Validate headers
  const headers = rows[0];
  const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    return { 
      isValid: false, 
      errors: [`Missing required headers: ${missingHeaders.join(", ")}`], 
      warnings: [],
      rows: [] 
    };
  }

  // Get column indexes for validation
  const priceIndex = headers.indexOf("Price");
  const skuIndex = headers.indexOf("SKU");
  const barcodeIndex = headers.indexOf("Barcode");

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

    // SKU Validation (if present but not required)
    if (skuIndex !== -1 && row[skuIndex]?.trim()) {
      const sku = row[skuIndex].trim();
      if (sku.length > 50) {
        warnings.push(`Row ${currentRowIndex}: SKU is longer than 50 characters`);
      }
    }

    // Barcode Validation (if present but not required)
    if (barcodeIndex !== -1 && row[barcodeIndex]?.trim()) {
      const barcode = row[barcodeIndex].trim();
      if (!/^[0-9]+$/.test(barcode)) {
        warnings.push(`Row ${currentRowIndex}: Barcode "${barcode}" should only contain numbers`);
      }
    }
  });

  return { 
    isValid: errors.length === 0, 
    errors, 
    warnings,
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
    warnings?: string[];
    rows: string[][];
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isUploading, uploadProgress, error, uploadCSV, resetUpload } = useCSVUpload();

  // Reset upload complete state when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setUploadComplete(false);
        resetUpload();
      }, 300); // Delay to ensure animation completes
    }
  }, [isOpen, resetUpload]);

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
          
          // Show warnings toggle if there are warnings
          setShowWarnings(result.warnings && result.warnings.length > 0);
        } else {
          setValidationResult(result);
          setFile(selectedFile);
          setFileContent(null);
          setShowWarnings(false);
        }
      } catch (error) {
        console.error("Error processing file:", error);
        setValidationResult({
          isValid: false,
          errors: ["Failed to process the file. Please check the file format."],
          warnings: [],
          rows: []
        });
        setShowWarnings(false);
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

  const resetForm = () => {
    setFile(null);
    setFileContent(null);
    setValidationResult(null);
    setUploadComplete(false);
    setShowWarnings(false);
    resetUpload();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!isUploading) {
          setIsOpen(open);
          if (!open) resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="h-10 gap-2 bg-white dark:bg-black dark:text-white border border-black dark:border-gray-600"
          size="sm"
          variant="default"
          onClick={() => setIsOpen(true)}
        >
          <Upload className="h-4 w-4" />
          <span>Import CSV</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Upload Product CSV</DialogTitle>
          <DialogDescription>
            Import your products in bulk using a CSV file. Please ensure your file follows the required format.
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
                className="whitespace-nowrap flex gap-1"
                disabled={!file || isUploading}
              >
                <X className="h-4 w-4" />
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
              <AlertDescription>Your product data has been uploaded successfully!</AlertDescription>
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
                  "--progress-background": "linear-gradient(to right, #3b82f6, #1d4ed8)"
                } as React.CSSProperties}
              />
              <p className="text-sm text-gray-600">Please do not close this window</p>
            </div>
          )}
          
          {/* Display validation errors if any */}
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
          
          {/* Display warnings if any and toggle is on */}
          {validationResult?.warnings && validationResult.warnings.length > 0 && showWarnings && (
            <div className="border border-amber-300 rounded-md p-3 bg-amber-50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-amber-800">
                  Warnings <Badge variant="outline" className="ml-2 bg-amber-100">{validationResult.warnings.length}</Badge>
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs" 
                  onClick={() => setShowWarnings(false)}
                >
                  Hide
                </Button>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-amber-700">{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Show toggle button for warnings if there are warnings but toggle is off */}
          {validationResult?.warnings && validationResult.warnings.length > 0 && !showWarnings && !isUploading && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-fit text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 hover:text-amber-800"
              onClick={() => setShowWarnings(true)}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Show {validationResult.warnings.length} warning{validationResult.warnings.length !== 1 ? 's' : ''}
            </Button>
          )}

          {/* Display CSV preview if available */}
          {validationResult?.rows && validationResult.rows.length > 0 && !isUploading && (
            <div className="overflow-auto max-h-60 border rounded-md">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {validationResult.rows[0]?.map((header, index) => (
                      <th key={index} className="border px-3 py-2 text-left text-sm font-medium text-gray-700">
                        {header}
                        {expectedHeaders.includes(header) && header !== "Department" && header !== "SKU" && header !== "Barcode" && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
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
                              <AlertCircle className="h-3 w-3 inline-block mr-1" />
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
              <Button 
                onClick={handleTemplateDownload} 
                variant="outline" 
                size="sm" 
                className="gap-1"
              >
                <Download className="h-4 w-4" />
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
                    <Upload className="h-4 w-4" />
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