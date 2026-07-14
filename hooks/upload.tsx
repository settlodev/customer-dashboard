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
  uploadCSV: (options: CSVUploadOptions) => Promise<any>;
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
      for (let i = 0; i < 10; i++) {
        setUploadProgress((prev) => Math.min(prev + 10, 100));
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const response = await uploadProductWithStockCSV({ fileData, fileName });
      setUploadProgress(100);
      return response;
    } catch (err: any) {
      const message =
        err?.message || "An unknown error occurred during upload.";
      setError(message);
      throw err; // re-throw so handleUpload can catch it too
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProgress, error, uploadCSV };
};
