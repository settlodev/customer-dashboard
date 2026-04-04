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

  const simulateProgress = useCallback(
    async (
      startValue: number,
      endValue: number,
      steps: number,
      delay: number,
    ) => {
      const stepSize = (endValue - startValue) / steps;

      for (let i = 0; i < steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        setUploadProgress((prev) =>
          Math.min(startValue + stepSize * (i + 1), endValue),
        );
      }
    },
    [],
  );

  const uploadCSV = async ({ fileData, fileName }: CSVUploadOptions) => {
    resetUpload();
    setIsUploading(true);

    try {
      // First phase: Data validation
      await simulateProgress(0, VALIDATION_STAGE, 3, 150);

      // Check file size to adjust simulation timing
      const fileSize = fileData.length;
      const isLargeFile = fileSize > 50000;

      const processingSteps = isLargeFile ? 8 : 5;
      const processingDelay = isLargeFile ? 200 : 150;
      await simulateProgress(
        VALIDATION_STAGE,
        PROCESSING_STAGE,
        processingSteps,
        processingDelay,
      );

      try {
        await uploadProductCSV({ fileData, fileName });

        await simulateProgress(PROCESSING_STAGE, FINAL_STAGE, 3, 180);
      } catch (apiError: any) {
        console.error("Error uploading CSV", apiError, apiError);
        setUploadProgress(Math.min(uploadProgress, 85));
        throw apiError;
      }
    } catch (err: any) {
      // Handle all errors
      console.error("The file upload failed for product csv:", err);

      const errorMessage =
        err.message || "An unknown error occurred during upload.";
      setError(errorMessage);
      throw err;
    }
  };

  return { isUploading, uploadProgress, error, uploadCSV, resetUpload };
};
