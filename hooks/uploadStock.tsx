


import { useState, useCallback } from "react";
import { uploadStockCSV } from "@/lib/actions/stock-actions";

interface CSVUploadOptions {
  fileData: string;
  fileName: string;
  uploadType: 'warehouse' | 'location';
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
const SIMULATION_STEP_TIME = 150; 
const VALIDATION_PROGRESS = 20; 
const PROCESSING_PROGRESS = 70; 
const COMPLETION_PROGRESS = 100; 

export const useCSVUpload = (): UseCSVUploadResult => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  }, []);

  const uploadCSV = async ({ fileData, fileName,uploadType }: CSVUploadOptions) => {
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
      const response = await uploadStockCSV({ fileData, fileName,uploadType: uploadType });
      
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