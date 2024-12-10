import { useState } from "react";
import { uploadProductWithStockCSV } from "@/lib/actions/stock-actions";

interface CSVUploadOptions {
  fileData: string;
  fileName: string;
}

interface UseCSVUploadResult {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadCSV: (options: CSVUploadOptions) => Promise<void>;
}

export const useCSVUpload = (): UseCSVUploadResult => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadCSV = async ({ fileData, fileName }: CSVUploadOptions) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const fileSize = fileData.length; // Approximate size in bytes
      const chunkSize = Math.ceil(fileSize / 10); // Example: Simulate progress in 10 chunks

      for (let i = 0; i < 10; i++) {
        setUploadProgress((prev) => Math.min(prev + 10, 100));
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulated delay
      }

      // Call the actual upload function
      await uploadProductWithStockCSV({ fileData, fileName });
      setUploadProgress(100); // Mark upload as complete
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during upload.");
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProgress, error, uploadCSV };
};
