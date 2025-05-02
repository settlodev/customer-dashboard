// import { useState } from "react";
// import { uploadStockCSV } from "@/lib/actions/stock-actions";

// interface CSVUploadOptions {
//   fileData: string;
//   fileName: string;
// }

// interface UseCSVUploadResult {
//   isUploading: boolean;
//   uploadProgress: number;
//   error: string | null;
//   uploadCSV: (options: CSVUploadOptions) => Promise<any>; // Return type modified to pass through the response
// }

// export const useCSVUpload = (): UseCSVUploadResult => {
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [error, setError] = useState<string | null>(null);

//   const uploadCSV = async ({ fileData, fileName }: CSVUploadOptions) => {
//     setIsUploading(true);
//     setError(null);
//     setUploadProgress(0);

//     try {
//       const fileSize = fileData.length; // Approximate size in bytes
//       const chunkSize = Math.ceil(fileSize / 10); // Example: Simulate progress in 10 chunks

//       for (let i = 0; i < 10; i++) {
//         setUploadProgress((prev) => Math.min(prev + 10, 100));
//         await new Promise((resolve) => setTimeout(resolve, 100)); // Simulated delay
//       }

//       // Call the actual upload function and get the response with task_id
//       const response = await uploadStockCSV({ fileData, fileName });
//       setUploadProgress(100); // Mark upload as complete
      
//       // Return the response so we can access the task_id
//       return response;
//     } catch (err: any) {
//       setError(err.message || "An unknown error occurred during upload.");
//       throw err;
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return { isUploading, uploadProgress, error, uploadCSV };
// };


import { useState, useCallback } from "react";
import { uploadStockCSV } from "@/lib/actions/stock-actions";

interface CSVUploadOptions {
  fileData: string;
  fileName: string;
}

interface UseCSVUploadResult {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadCSV: (options: CSVUploadOptions) => Promise<any>;
  resetUpload: () => void;
}

// Constants for timeouts and progress steps
const UPLOAD_SIMULATION_STEPS = 8;
const SIMULATION_STEP_TIME = 150; // milliseconds
const VALIDATION_PROGRESS = 20; // First 20% for validation
const PROCESSING_PROGRESS = 70; // Next 50% for processing
const COMPLETION_PROGRESS = 100; // Final 30% for completion

export const useCSVUpload = (): UseCSVUploadResult => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  }, []);

  const uploadCSV = async ({ fileData, fileName }: CSVUploadOptions) => {
    resetUpload();
    setIsUploading(true);

    // Validation phase
    try {
      // First phase: Validation (simulated)
      for (let i = 0; i < 2; i++) {
        await new Promise((resolve) => setTimeout(resolve, SIMULATION_STEP_TIME));
        setUploadProgress((prev) => Math.min(prev + VALIDATION_PROGRESS / 2, VALIDATION_PROGRESS));
      }

      // Second phase: Processing (simulated)
      const processingSteps = UPLOAD_SIMULATION_STEPS - 2; // Subtract validation steps
      const progressPerStep = (PROCESSING_PROGRESS - VALIDATION_PROGRESS) / processingSteps;

      for (let i = 0; i < processingSteps; i++) {
        await new Promise((resolve) => setTimeout(resolve, SIMULATION_STEP_TIME));
        setUploadProgress((prev) => 
          Math.min(prev + progressPerStep, PROCESSING_PROGRESS)
        );
      }

      // Final phase: Actual upload
      const response = await uploadStockCSV({ fileData, fileName });
      
      // Complete the progress
      setUploadProgress(COMPLETION_PROGRESS);
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred during upload.";
      setError(errorMessage);
      
      // Reset progress on error
      setUploadProgress(0);
      throw err;
    } finally {
      // Keep isUploading true until the component handles completion
      // This will be reset when the component calls resetUpload
    }
  };

  return { isUploading, uploadProgress, error, uploadCSV, resetUpload };
};