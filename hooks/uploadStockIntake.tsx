
"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadStockIntakeCSV } from "@/lib/actions/stock-intake-actions";

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
const VALIDATION_PROGRESS = 20; 
const PROCESSING_PROGRESS = 70; 
const COMPLETION_PROGRESS = 100; 

export const useCSVUpload = (): UseCSVUploadResult => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // const router = useRouter();

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  }, []);

  const uploadCSV = async ({ fileData, fileName }: CSVUploadOptions) => {
    resetUpload();
    setIsUploading(true);

    try {
      // First phase: Validation (simulated)
      for (let i = 0; i < 2; i++) {
        await new Promise((resolve) => setTimeout(resolve, SIMULATION_STEP_TIME));
        setUploadProgress((prev) => Math.min(prev + VALIDATION_PROGRESS / 2, VALIDATION_PROGRESS));
      }

      // Second phase: Processing (simulated)
      const processingSteps = UPLOAD_SIMULATION_STEPS - 2;
      const progressPerStep = (PROCESSING_PROGRESS - VALIDATION_PROGRESS) / processingSteps;

      for (let i = 0; i < processingSteps; i++) {
        await new Promise((resolve) => setTimeout(resolve, SIMULATION_STEP_TIME));
        setUploadProgress((prev) => 
          Math.min(prev + progressPerStep, PROCESSING_PROGRESS)
        );
      }

      // Actual upload
      const response = await uploadStockIntakeCSV({ fileData, fileName });
      
      // Complete the progress
      setUploadProgress(COMPLETION_PROGRESS);
      
      // Handle navigation on client side
      // router.push("/stock-intakes");
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred during upload.";
      setError(errorMessage);
      setUploadProgress(0);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProgress, error, uploadCSV, resetUpload };
};