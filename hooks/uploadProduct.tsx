// import { useState } from "react";
// import { uploadProductCSV } from "@/lib/actions/product-actions";

// interface CSVUploadOptions {
//   fileData: string;
//   fileName: string;
// }

// interface UseCSVUploadResult {
//   isUploading: boolean;
//   uploadProgress: number;
//   error: string | null;
//   uploadCSV: (options: CSVUploadOptions) => Promise<void>;
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

//       // Call the actual upload function
//       await uploadProductCSV({ fileData, fileName });
//       setUploadProgress(100); // Mark upload as complete
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
import { uploadProductCSV } from "@/lib/actions/product-actions";

interface CSVUploadOptions {
  fileData: string;
  fileName: string;
}

interface UseCSVUploadResult {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadCSV: (options: CSVUploadOptions) => Promise<void>;
  resetUpload: () => void;
}

// Progress simulation constants for a more realistic experience
const VALIDATION_STAGE = 15; // First 15% for validation
const PROCESSING_STAGE = 65; // Next 50% for processing
const FINAL_STAGE = 100; // Last 35% for completion

export const useCSVUpload = (): UseCSVUploadResult => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  }, []);

  const simulateProgress = useCallback(async (startValue: number, endValue: number, steps: number, delay: number) => {
    const stepSize = (endValue - startValue) / steps;
    
    for (let i = 0; i < steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      setUploadProgress(prev => Math.min(startValue + stepSize * (i + 1), endValue));
    }
  }, []);

  const uploadCSV = async ({ fileData, fileName }: CSVUploadOptions) => {
    resetUpload();
    setIsUploading(true);

    try {
      // First phase: Data validation
      await simulateProgress(0, VALIDATION_STAGE, 3, 150);
      
      // Check file size to adjust simulation timing
      const fileSize = fileData.length;
      const isLargeFile = fileSize > 50000; // Adjust threshold as needed
      
      // Second phase: Processing (more steps for larger files)
      const processingSteps = isLargeFile ? 8 : 5;
      const processingDelay = isLargeFile ? 200 : 150;
      await simulateProgress(VALIDATION_STAGE, PROCESSING_STAGE, processingSteps, processingDelay);

      // Final phase: Actual API call
      try {
        await uploadProductCSV({ fileData, fileName });
        
        // Simulate final phase (server processing and confirmation)
        await simulateProgress(PROCESSING_STAGE, FINAL_STAGE, 3, 180);
      } catch (apiError: any) {
        // If the API call fails, still show partial progress but throw the error
        setUploadProgress(Math.min(uploadProgress, 85)); // Cap at 85% if error occurs
        throw apiError;
      }
    } catch (err: any) {
      // Handle all errors
      const errorMessage = err.message || "An unknown error occurred during upload.";
      setError(errorMessage);
      throw err;
    }
    // We don't reset isUploading here to allow the component to control when to reset
  };

  return { isUploading, uploadProgress, error, uploadCSV, resetUpload };
};