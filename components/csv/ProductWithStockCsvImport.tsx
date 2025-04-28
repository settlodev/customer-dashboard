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
// import { Icon } from "@iconify/react";
// import React from "react";

// import { useCSVUpload } from "@/hooks/upload";
// import { Progress } from "@radix-ui/react-progress";

// // Validation Function
// const validateCSV = (
//   fileContent: string,
//   expectedHeaders: string[]
// ): { isValid: boolean; errors: string[]; rows: string[][] } => {
//   const lines = fileContent.split("\n").filter(Boolean);
//   const rows: string[][] = lines.map(line => 
//     line.split(",").map(cell => cell.trim().replace(/\s+/g, ' '))
//   );

//   const errors: string[] = [];

//   if (rows.length === 0) {
//     return { isValid: false, errors: ["The file is empty."], rows: [] };
//   }

//   const emojiRegex = /[\u{1F300}-\u{1F9FF}|\u{2700}-\u{27BF}|\u{2600}-\u{26FF}|\u{2300}-\u{23FF}|\u{2000}-\u{206F}|\u{FE00}-\u{FE0F}]/gu;
//   const textFields = ["Product Name", "Category Name", "Stock Name", "Stock Variant Name", "Variant Name"];

//   const headers = rows[0];
//   const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));
//   if (missingHeaders.length > 0) {
//     return { isValid: false, errors: [`Missing required headers: ${missingHeaders.join(", ")}`], rows: [] };
//   }

//   rows.slice(1).forEach((row, rowIndex) => {
//     const rowErrors: string[] = [];
//     const currentRowIndex = rowIndex + 2;

//     textFields.forEach((field) => {
//       const fieldIndex = headers.indexOf(field);
//       if (fieldIndex !== -1 && row[fieldIndex] && emojiRegex.test(row[fieldIndex])) {
//         rowErrors.push(`Row ${currentRowIndex}: "${field}" contains emojis which are not allowed.`);
//       }
//     });

//     const requiredFields = ["Product Name", "Category Name", "Variant Name", "Price", "Quantity", "Stock Name", "Stock Variant Name", "Starting Quantity", "Starting Value", "Alert Level"];
//     requiredFields.forEach((field) => {
//       const fieldIndex = headers.indexOf(field);
//       if (fieldIndex !== -1 && (!row[fieldIndex] || row[fieldIndex].trim() === "")) {
//         rowErrors.push(`Row ${currentRowIndex}: "${field}" cannot be empty.`);
//       }
//     });

//     const priceIndex = headers.indexOf("Price");
//     if (priceIndex !== -1) {
//       const price = parseFloat(row[priceIndex]);
//       if (isNaN(price) || price <= 0) {
//         rowErrors.push(`Row ${currentRowIndex}: "Price" must be greater than zero.`);
//       }
//     }

//     const startingQuantityIndex = headers.indexOf("Starting Quantity");
//     if (startingQuantityIndex !== -1) {
//       const startingQuantity = parseFloat(row[startingQuantityIndex]);
//       if (isNaN(startingQuantity) || startingQuantity < 0) {
//         rowErrors.push(`Row ${currentRowIndex}: "Starting Quantity" cannot be less than zero.`);
//       }
//     }

//     const startingValueIndex = headers.indexOf("Starting Value");
//     if (startingValueIndex !== -1) {
//       const startingValue = parseInt(row[startingValueIndex], 10);
//       if (isNaN(startingValue) || startingValue < 0) {
//         rowErrors.push(`Row ${currentRowIndex}: "Starting Value" cannot be less than zero.`);
//       }
//     }

//     const alertLevelIndex = headers.indexOf("Alert Level");
//     if (alertLevelIndex !== -1) {
//       const alertLevel = parseInt(row[alertLevelIndex], 10);
//       if (isNaN(alertLevel) || alertLevel < 0) {
//         rowErrors.push(`Row ${currentRowIndex}: "Alert Level" cannot be less than zero.`);
//       }
//     }

//     if (rowErrors.length > 0) {
//       errors.push(...rowErrors);
//     }
//   });

//   return { isValid: errors.length === 0, errors, rows };
// };

// export function ProductWithStockCSVDialog() {
//   const expectedHeaders = [
//     "Product Name",
//     "Category Name",
//     "Variant Name",
//     "Price",
//     "SKU",
//     "Barcode",
//     "Department",
//     "Stock Name",
//     "Stock Variant Name",
//     "Starting Quantity",
//     "Starting Value",
//     "Alert Level",
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

//         if (result.isValid) {
//           const cleanedCSV = result.rows.map(row => row.join(',')).join('\n');
//           setValidationResult(result);
//           setFile(selectedFile);
//           setFileContent(cleanedCSV); 
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
//         await uploadCSV({ fileData: fileContent, fileName: file.name });
//         resetForm();
//         setIsOpen(false);
//       } catch (error) {
//         console.error("Error uploading file:", error);
//       }
//     }
//   };

//   const handleTemplateDownload = () => {
//     fetch("/csv/stock-template.csv")
//       .then((res) => {
//         if (res.ok) {
//           window.open("/csv/ProductWithStock.csv", "_blank");
//         } else {
//           alert("Template not found");
//         }
//       })
//       .catch(() => alert("Failed to download template"));
//   };

//   const resetForm = () => {
//     setFile(null);
//     setFileContent(null);
//     setValidationResult(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const productCount = validationResult?.rows?.length ? validationResult.rows.length - 1 : 0;

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         <Button
//           className="h-10 gap-1 dark:bg-white dark:text-black-2"
//           size="sm"
//           variant="outline"
//           onClick={() => setIsOpen(true)}
//         >
//           <Icon className="h-3.5 w-3.5" icon="mdi:file-import" />
//           <span className="sr-only sm:not-sr-only sm:whitespace-nowrap text-black-2 dark:bg-white dark:text-black-2">Import CSV (Stock & Product)</span>
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="w-[90vw] lg:max-w-[1000px]">
//         <DialogHeader>
//           <DialogTitle>Import Stock with products</DialogTitle>
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
//                     {validationResult.rows[0]?.map((header, index) => (
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
//               <div className="mt-4 space-y-1">
//                 <div className="flex items-center justify-between mb-1">
//                   <span className="text-sm font-medium text-gray-700">Uploading...</span>
//                   <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
//                 </div>
//                 <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
//                   <div 
//                     className="h-full bg-emerald-500 rounded-full transition-all duration-300"
//                     style={{ width: `${uploadProgress}%` }}
//                   />
//                 </div>
//                 {uploadProgress < 100 ? (
//                   <p className="text-xs text-gray-500">Please wait while your file uploads...</p>
//                 ) : (
//                   <p className="text-xs text-emerald-600">Upload complete!</p>
//                 )}
//               </div>
//             )}
//           {error && <p className="text-red-500 text-sm">{error}</p>}
//         </div>

//         {validationResult?.isValid && productCount > 0 && (
//           <div className="text-sm text-green-600 font-medium pt-2">
//             You're uploading a total of <strong>{productCount}</strong> products with stock.
//           </div>
//         )}

//         {validationResult && !validationResult.isValid && (
//           <div className="text-sm text-red-600 pt-2">
//             Please fix the issues above before uploading.
//           </div>
//         )}

//         <DialogFooter>
//           <Button onClick={handleTemplateDownload} variant="outline" size="sm" className="gap-1">
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


// 'use client';

// import { useState, useRef, useEffect } from "react";
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
// import { Icon } from "@iconify/react";
// import React from "react";
// import { useCSVUpload } from "@/hooks/upload";
// import { checkTaskStatus } from "@/lib/actions/stock-actions";
// // Make sure this import path is correct for your project

// // Validation Function - Keeping as is from your original code
// const validateCSV = (
//   fileContent: string,
//   expectedHeaders: string[]
// ): { isValid: boolean; errors: string[]; rows: string[][] } => {
//   const lines = fileContent.split("\n").filter(Boolean);
//   const rows: string[][] = lines.map(line => 
//     line.split(",").map(cell => cell.trim().replace(/\s+/g, ' '))
//   );

//   const errors: string[] = [];

//   if (rows.length === 0) {
//     return { isValid: false, errors: ["The file is empty."], rows: [] };
//   }

//   const emojiRegex = /[\u{1F300}-\u{1F9FF}|\u{2700}-\u{27BF}|\u{2600}-\u{26FF}|\u{2300}-\u{23FF}|\u{2000}-\u{206F}|\u{FE00}-\u{FE0F}]/gu;
//   const textFields = ["Product Name", "Category Name", "Stock Name", "Stock Variant Name", "Variant Name"];

//   const headers = rows[0];
//   const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));
//   if (missingHeaders.length > 0) {
//     return { isValid: false, errors: [`Missing required headers: ${missingHeaders.join(", ")}`], rows: [] };
//   }

//   rows.slice(1).forEach((row, rowIndex) => {
//     const rowErrors: string[] = [];
//     const currentRowIndex = rowIndex + 2;

//     textFields.forEach((field) => {
//       const fieldIndex = headers.indexOf(field);
//       if (fieldIndex !== -1 && row[fieldIndex] && emojiRegex.test(row[fieldIndex])) {
//         rowErrors.push(`Row ${currentRowIndex}: "${field}" contains emojis which are not allowed.`);
//       }
//     });

//     const requiredFields = ["Product Name", "Category Name", "Variant Name", "Price", "Quantity", "Stock Name", "Stock Variant Name", "Starting Quantity", "Starting Value", "Alert Level"];
//     requiredFields.forEach((field) => {
//       const fieldIndex = headers.indexOf(field);
//       if (fieldIndex !== -1 && (!row[fieldIndex] || row[fieldIndex].trim() === "")) {
//         rowErrors.push(`Row ${currentRowIndex}: "${field}" cannot be empty.`);
//       }
//     });

//     const priceIndex = headers.indexOf("Price");
//     if (priceIndex !== -1) {
//       const price = parseFloat(row[priceIndex]);
//       if (isNaN(price) || price <= 0) {
//         rowErrors.push(`Row ${currentRowIndex}: "Price" must be greater than zero.`);
//       }
//     }

//     const startingQuantityIndex = headers.indexOf("Starting Quantity");
//     if (startingQuantityIndex !== -1) {
//       const startingQuantity = parseFloat(row[startingQuantityIndex]);
//       if (isNaN(startingQuantity) || startingQuantity < 0) {
//         rowErrors.push(`Row ${currentRowIndex}: "Starting Quantity" cannot be less than zero.`);
//       }
//     }

//     const startingValueIndex = headers.indexOf("Starting Value");
//     if (startingValueIndex !== -1) {
//       const startingValue = parseInt(row[startingValueIndex], 10);
//       if (isNaN(startingValue) || startingValue < 0) {
//         rowErrors.push(`Row ${currentRowIndex}: "Starting Value" cannot be less than zero.`);
//       }
//     }

//     const alertLevelIndex = headers.indexOf("Alert Level");
//     if (alertLevelIndex !== -1) {
//       const alertLevel = parseInt(row[alertLevelIndex], 10);
//       if (isNaN(alertLevel) || alertLevel < 0) {
//         rowErrors.push(`Row ${currentRowIndex}: "Alert Level" cannot be less than zero.`);
//       }
//     }

//     if (rowErrors.length > 0) {
//       errors.push(...rowErrors);
//     }
//   });

//   return { isValid: errors.length === 0, errors, rows };
// };

// export function ProductWithStockCSVDialog() {
//   const expectedHeaders = [
//     "Product Name",
//     "Category Name",
//     "Variant Name",
//     "Price",
//     "SKU",
//     "Barcode",
//     "Department",
//     "Stock Name",
//     "Stock Variant Name",
//     "Starting Quantity",
//     "Starting Value",
//     "Alert Level",
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

//   // New state variables for task status
//   const [taskId, setTaskId] = useState<string | null>(null);
//   const [taskStatus, setTaskStatus] = useState<string | null>(null);
//   const [taskMessage, setTaskMessage] = useState<string | null>(null);
//   const [isPolling, setIsPolling] = useState(false);
//   const [shouldRedirect, setShouldRedirect] = useState(false);

//   const { isUploading, uploadProgress, error, uploadCSV } = useCSVUpload();

//   // Effect to poll task status
//   useEffect(() => {
//     let pollingInterval: NodeJS.Timeout | null = null;

//     const pollTaskStatus = async () => {
//       if (!taskId || !isPolling) return;

//       try {
//         const status = await checkTaskStatus(taskId);
//         console.log("Task status check:", status);

//         setTaskStatus(status.csv_upload_status);
//         setTaskMessage(status.message);

//         // If task is complete or failed, stop polling
//         if (status.csv_upload_status === "complete" || status.csv_upload_status === "failed") {
//           setIsPolling(false);
//           if (pollingInterval) clearInterval(pollingInterval);
          
//           // If task is complete and user chose to redirect, redirect now
//           if (status.csv_upload_status === "complete" && shouldRedirect) {
//             window.location.href = "/stocks";
//           }
//         }
//       } catch (error) {
//         console.error("Error checking task status:", error);
//         setTaskStatus("error");
//         setTaskMessage("Failed to check task status");
//         setIsPolling(false);
//         if (pollingInterval) clearInterval(pollingInterval);
//       }
//     };

//     if (taskId && isPolling) {
//       // Initial check
//       pollTaskStatus();
      
//       // Set up polling interval (every 2 seconds)
//       pollingInterval = setInterval(pollTaskStatus, 2000);
//     }

//     // Cleanup function
//     return () => {
//       if (pollingInterval) clearInterval(pollingInterval);
//     };
//   }, [taskId, isPolling, shouldRedirect]);

//   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = event.target.files?.[0];

//     if (selectedFile) {
//       try {
//         const fileText = await selectedFile.text();
//         const result = validateCSV(fileText, expectedHeaders);

//         if (result.isValid) {
//           const cleanedCSV = result.rows.map(row => row.join(',')).join('\n');
//           setValidationResult(result);
//           setFile(selectedFile);
//           setFileContent(cleanedCSV); 
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
//         const response = await uploadCSV({ fileData: fileContent, fileName: file.name });
        
//         console.log("Upload response:", response);
        
//         // If the upload function returns a response with task_id
//         if (response && response.task_id) {
//           setTaskId(response.task_id);
//           setIsPolling(true);
//           setTaskStatus("processing");
//         } else {
//           console.error("No task ID returned from upload");
//           setTaskStatus("error");
//           setTaskMessage("Failed to start task");
//         }
//       } catch (error) {
//         console.error("Error uploading file:", error);
//         setTaskStatus("error");
//         setTaskMessage("Upload failed");
//       }
//     }
//   };

//   // const handleUpload = async () => {
//   //       if (file && fileContent && validationResult?.isValid) {
//   //         try {
//   //           await uploadCSV({ fileData: fileContent, fileName: file.name });
//   //           resetForm();
//   //           setIsOpen(false);
//   //         } catch (error) {
//   //           console.error("Error uploading file:", error);
//   //         }
//   //       }
//   //     };

//   const handleTemplateDownload = () => {
//     fetch("/csv/stock-template.csv")
//       .then((res) => {
//         if (res.ok) {
//           window.open("/csv/ProductWithStock.csv", "_blank");
//         } else {
//           alert("Template not found");
//         }
//       })
//       .catch(() => alert("Failed to download template"));
//   };

//   const resetForm = () => {
//     setFile(null);
//     setFileContent(null);
//     setValidationResult(null);
//     setTaskId(null);
//     setTaskStatus(null);
//     setTaskMessage(null);
//     setIsPolling(false);
//     setShouldRedirect(false);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleRedirectToStocks = () => {
//     if (taskStatus === "complete") {
//       window.location.href = "/stocks";
//     } else {
//       // Set flag to redirect once task completes
//       setShouldRedirect(true);
//     }
//   };

//   const handleClose = () => {
//     resetForm();
//     setIsOpen(false);
//   };

//   const productCount = validationResult?.rows?.length ? validationResult.rows.length - 1 : 0;

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => {
//       if (!open) {
//         handleClose();
//       } else {
//         setIsOpen(true);
//       }
//     }}>
//       <DialogTrigger asChild>
//         <Button
//           className="h-10 gap-1 dark:bg-white dark:text-black-2"
//           size="sm"
//           variant="outline"
//           onClick={() => setIsOpen(true)}
//         >
//           <Icon className="h-3.5 w-3.5" icon="mdi:file-import" />
//           <span className="sr-only sm:not-sr-only sm:whitespace-nowrap text-black-2 dark:bg-white dark:text-black-2">Import CSV (Stock & Product)</span>
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="w-[90vw] lg:max-w-[1000px]">
//         <DialogHeader>
//           <DialogTitle>Import Stock with products</DialogTitle>
//           <DialogDescription>
//             Select a CSV file to upload. Please ensure that the file is formatted correctly.
//           </DialogDescription>
//         </DialogHeader>

//         {taskStatus === "complete" ? (
//           <div className="py-4 text-center">
//             <div className="flex justify-center mb-4">
//               <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
//                 <Icon icon="mdi:check-circle" className="h-12 w-12 text-green-500" />
//               </div>
//             </div>
//             <h3 className="text-lg font-medium text-green-600 mb-2">Upload Successful!</h3>
//             <p className="text-gray-600 mb-4">
//               Your stock has been successfully uploaded. You can close this page or move around and come back - your stock will be here after a while.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-3 justify-center">
//               <Button onClick={handleClose} variant="outline">
//                 Close
//               </Button>
//               <Button onClick={handleRedirectToStocks}>
//                 Go to Stocks
//               </Button>
//             </div>
//           </div>
//         ) : (
//           <>
//             <div className="grid gap-4 py-4">
//               {taskStatus === "processing" ? (
//                 <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
//                   <div className="flex items-center justify-center mb-4">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//                   </div>
//                   <p className="text-center text-blue-700 mb-3">
//                     Processing your stock upload. This may take a few moments...
//                   </p>
//                   <p className="text-center text-sm text-gray-500">
//                     You can close this dialog and continue working. Your stock will be available shortly.
//                   </p>
//                   <div className="mt-4 flex justify-center">
//                     <Button 
//                       variant="outline" 
//                       size="sm"
//                       onClick={() => {
//                         setShouldRedirect(true);
//                         handleClose();
//                       }}
//                     >
//                       Close and continue working
//                     </Button>
//                   </div>
//                 </div>
//               ) : taskStatus === "failed" || taskStatus === "error" ? (
//                 <div className="p-4 rounded-lg bg-red-50 border border-red-200">
//                   <div className="flex items-center justify-center mb-4">
//                     <Icon icon="mdi:alert-circle" className="h-8 w-8 text-red-500" />
//                   </div>
//                   <p className="text-center text-red-700">
//                     {taskMessage || "Failed to process stock upload. Please try again."}
//                   </p>
//                   <div className="mt-4 flex justify-center">
//                     <Button onClick={resetForm} variant="outline">
//                       Try Again
//                     </Button>
//                   </div>
//                 </div>
//               ) : (
//                 <>
//                   <Input
//                     ref={fileInputRef}
//                     id="csv"
//                     type="file"
//                     accept=".csv"
//                     onChange={handleFileChange}
//                     className="w-full"
//                   />
//                   {validationResult?.rows && (
//                     <div className="overflow-auto max-h-60">
//                       <table className="min-w-full border-collapse border border-gray-300">
//                         <thead>
//                           <tr>
//                             {validationResult.rows[0]?.map((header, index) => (
//                               <th key={index} className="border px-2 py-1 bg-gray-100">
//                                 {header}
//                               </th>
//                             ))}
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {validationResult.rows.slice(1).map((row, rowIndex) => (
//                             <React.Fragment key={rowIndex}>
//                               <tr>
//                                 {row.map((cell, cellIndex) => (
//                                   <td key={cellIndex} className="border px-2 py-1">
//                                     {cell}
//                                   </td>
//                                 ))}
//                               </tr>
//                               {validationResult.errors
//                                 .filter((error) => error.includes(`Row ${rowIndex + 2}`))
//                                 .map((error, errorIndex) => (
//                                   <tr key={`error-${rowIndex}-${errorIndex}`}>
//                                     <td
//                                       colSpan={row.length}
//                                       className="border px-2 py-1 text-red-500 text-sm"
//                                     >
//                                       {error}
//                                     </td>
//                                   </tr>
//                                 ))}
//                             </React.Fragment>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}

//                   {uploadProgress > 0 && (
//                     <div className="mt-4 space-y-1">
//                       <div className="flex items-center justify-between mb-1">
//                         <span className="text-sm font-medium text-gray-700">Uploading...</span>
//                         <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
//                       </div>
//                       <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
//                         <div 
//                           className="h-full bg-emerald-500 rounded-full transition-all duration-300"
//                           style={{ width: `${uploadProgress}%` }}
//                         />
//                       </div>
//                       {uploadProgress < 100 ? (
//                         <p className="text-xs text-gray-500">Please wait while your file uploads...</p>
//                       ) : (
//                         <p className="text-xs text-emerald-600">Upload complete! Processing data...</p>
//                       )}
//                     </div>
//                   )}
//                   {error && <p className="text-red-500 text-sm">{error}</p>}
//                 </>
//               )}
//             </div>

//             {validationResult?.isValid && productCount > 0 && !taskStatus && (
//               <div className="text-sm text-green-600 font-medium pt-2">
//                 You're uploading a total of <strong>{productCount}</strong> products with stock.
//               </div>
//             )}

//             {validationResult && !validationResult.isValid && !taskStatus && (
//               <div className="text-sm text-red-600 pt-2">
//                 Please fix the issues above before uploading.
//               </div>
//             )}

//             <DialogFooter>
//               {taskStatus === "processing" ? (
//                 <Button disabled variant="outline">
//                   Processing...
//                 </Button>
//               ) : taskStatus === "failed" || taskStatus === "error" ? (
//                 <Button onClick={resetForm} variant="outline">
//                   Try Again
//                 </Button>
//               ) : (
//                 <>
//                   <Button onClick={handleTemplateDownload} variant="outline" size="sm" className="gap-1">
//                     Download Template
//                   </Button>
//                   <Button
//                     type="submit"
//                     onClick={handleUpload}
//                     disabled={!file || !(validationResult?.isValid)}
//                   >
//                     Upload CSV
//                   </Button>
//                 </>
//               )}
//             </DialogFooter>
//           </>
//         )}
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
import { Icon } from "@iconify/react";
import React from "react";
import { useCSVUpload } from "@/hooks/upload";
import { checkTaskStatus } from "@/lib/actions/stock-actions";
// Optionally import router if using Next.js
// import { useRouter } from "next/navigation";

// Validation Function - Keeping as is from your original code
const validateCSV = (
  fileContent: string,
  expectedHeaders: string[]
): { isValid: boolean; errors: string[]; rows: string[][] } => {
  // Your existing validation function code
  const lines = fileContent.split("\n").filter(Boolean);
  const rows: string[][] = lines.map(line => 
    line.split(",").map(cell => cell.trim().replace(/\s+/g, ' '))
  );

  const errors: string[] = [];

  if (rows.length === 0) {
    return { isValid: false, errors: ["The file is empty."], rows: [] };
  }

  const emojiRegex = /[\u{1F300}-\u{1F9FF}|\u{2700}-\u{27BF}|\u{2600}-\u{26FF}|\u{2300}-\u{23FF}|\u{2000}-\u{206F}|\u{FE00}-\u{FE0F}]/gu;
  const textFields = ["Product Name", "Category Name", "Stock Name", "Stock Variant Name", "Variant Name"];

  const headers = rows[0];
  const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    return { isValid: false, errors: [`Missing required headers: ${missingHeaders.join(", ")}`], rows: [] };
  }

    // Validate rows
    rows.slice(1).forEach((row, rowIndex) => {
      const rowErrors: string[] = [];
      const currentRowIndex = rowIndex + 2; // Adjusting for 1-based index with headers
  
      // Check for emojis in text fields
      textFields.forEach((field) => {
        const fieldIndex = headers.indexOf(field);
        if (fieldIndex !== -1 && row[fieldIndex]) {
          if (emojiRegex.test(row[fieldIndex])) {
            rowErrors.push(`Row ${currentRowIndex}: "${field}" contains emojis which are not allowed.`);
          }
        }
      });
  
      // Required Field Validation
      const requiredFields = ["Product Name", "Category Name", "Variant Name", "Price", "Quantity", "Stock Name", "Stock Variant Name", "starting Quantity", "starting Value", "Alert Level"];
      requiredFields.forEach((field) => {
  
  
        const fieldIndex = headers.indexOf(field);
        if (fieldIndex !== -1 && (!row[fieldIndex] || row[fieldIndex].trim() === "")) {
          rowErrors.push(`Row ${currentRowIndex}: "${field}" cannot be empty.`);
        }
      });
  
      // Specific Field Validation
      const priceIndex = headers.indexOf("Price");
      if (priceIndex !== -1) {
        const price = parseFloat(row[priceIndex]);
        if (isNaN(price) || price <= 0) {
          rowErrors.push(`Row ${currentRowIndex}: "Price" must be greater than zero.`);
        }
      }

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

export function ProductWithStockCSVDialog() {
  // If using Next.js router
  // const router = useRouter();
  
  const expectedHeaders = [
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

  // Task status states
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [taskMessage, setTaskMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [backgroundProcessing, setBackgroundProcessing] = useState(false);

  const {uploadProgress, error, uploadCSV } = useCSVUpload();

  // Function to handle successful upload completion and refresh
  const handleSuccessfulUpload = () => {
    // If we're in background processing mode, don't close the dialog or refresh
    if (backgroundProcessing) return;
    
    // Close the dialog
    setIsOpen(false);
    
    // Reset the form state
    resetForm();
    
    // Refresh the page to show new data
    window.location.reload();
    
    // Alternative for Next.js
    // router.refresh();
  };

  // Effect to poll task status
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const pollTaskStatus = async () => {
      if (!taskId || !isPolling) return;

      try {
        const status = await checkTaskStatus(taskId);
        console.log("Task status check:", status);

        setTaskStatus(status.csv_upload_status);
        setTaskMessage(status.message);

        // If task is complete or failed, stop polling
        if (status.csv_upload_status === "complete" || status.csv_upload_status === "failed") {
          setIsPolling(false);
          if (pollingInterval) clearInterval(pollingInterval);
          
          // Handle different completion scenarios
          if (status.csv_upload_status === "complete") {
            // If user asked to redirect, do that
            if (shouldRedirect) {
              window.location.href = "/stocks";
            } 
            // If background processing, just set a flag (could trigger notification)
            else if (backgroundProcessing) {
              console.log("Background processing complete");
              // Could trigger a toast notification here
            }
            // Otherwise close and refresh
            else {
              handleSuccessfulUpload();
            }
          }
        }
      } catch (error) {
        console.error("Error checking task status:", error);
        setTaskStatus("error");
        setTaskMessage("Failed to check task status");
        setIsPolling(false);
        if (pollingInterval) clearInterval(pollingInterval);
      }
    };

    if (taskId && isPolling) {
      // Initial check
      pollTaskStatus();
      
      // Set up polling interval (every 2 seconds)
      pollingInterval = setInterval(pollTaskStatus, 2000);
    }

    // Cleanup function
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [taskId, isPolling, shouldRedirect, backgroundProcessing]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      try {
        const fileText = await selectedFile.text();
        const result = validateCSV(fileText, expectedHeaders);

        if (result.isValid) {
          const cleanedCSV = result.rows.map(row => row.join(',')).join('\n');
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
        const response = await uploadCSV({ fileData: fileContent, fileName: file.name });
        
        console.log("Upload response:", response);
        
        // If the upload function returns a response with task_id
        if (response && response.task_id) {
          setTaskId(response.task_id);
          setIsPolling(true);
          setTaskStatus("processing");
        } else {
          console.error("No task ID returned from upload");
          setTaskStatus("error");
          setTaskMessage("Failed to start task");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setTaskStatus("error");
        setTaskMessage("Upload failed");
      }
    }
  };

  const handleTemplateDownload = () => {
    fetch("/csv/stock-template.csv")
      .then((res) => {
        if (res.ok) {
          window.open("/csv/ProductWithStock.csv", "_blank");
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
    setTaskId(null);
    setTaskStatus(null);
    setTaskMessage(null);
    setIsPolling(false);
    setShouldRedirect(false);
    setBackgroundProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRedirectToStocks = () => {
    if (taskStatus === "complete") {
      window.location.href = "/stocks";
    } else {
      // Set flag to redirect once task completes
      setShouldRedirect(true);
    }
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  // New function to continue processing in background
  const handleBackgroundProcessing = () => {
    setBackgroundProcessing(true);
    setIsOpen(false);
    
    // Could show a toast notification here that processing will continue
    console.log("Processing will continue in the background");
    
    // Optionally refresh the page anyways
    // This depends on your UX requirements
    window.location.reload();
  };

  const productCount = validationResult?.rows?.length ? validationResult.rows.length - 1 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Only allow closing if not processing or if we explicitly want to close
        if (taskStatus !== "processing" || backgroundProcessing) {
          handleClose();
        }
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
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap text-black-2 dark:bg-white dark:text-black-2">Import CSV (Stock & Product)</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Import Stock with products</DialogTitle>
          <DialogDescription>
            Select a CSV file to upload. Please ensure that the file is formatted correctly.
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
              Your stock has been successfully uploaded. You can close this page or move around and come back - your stock will be here after a while.
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
                            {validationResult.rows[0]?.map((header, index) => (
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
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                </>
              )}
            </div>

            {validationResult?.isValid && productCount > 0 && !taskStatus && (
              <div className="text-sm text-green-600 font-medium pt-2">
                You&rsquo;re uploading a total of <strong>{productCount}</strong> products with stock.
              </div>
            )}

            {validationResult && !validationResult.isValid && !taskStatus && (
              <div className="text-sm text-red-600 pt-2">
                Please fix the issues above before uploading.
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
                    Processing...
                  </Button>
                </div>
              ) : taskStatus === "failed" || taskStatus === "error" ? (
                <Button onClick={resetForm} variant="outline">
                  Try Again
                </Button>
              ) : (
                <>
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
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}