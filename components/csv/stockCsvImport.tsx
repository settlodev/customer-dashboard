"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Check,
  Loader2,
  Upload,
  FileDown,
  FileUp,
} from "lucide-react";
import {
  startStockImport,
  getImportJobStatus,
} from "@/lib/actions/stock-actions";
import type { CsvImportJobResponse } from "@/types/stock/type";

export function CSVStockDialog({
  uploadType,
}: {
  uploadType: "location" | "warehouse";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [job, setJob] = useState<CsvImportJobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setFileContent(null);
    setIsUploading(false);
    setJob(null);
    setError(null);
    if (pollRef.current) clearInterval(pollRef.current);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(reset, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, reset]);

  // Poll for job status
  useEffect(() => {
    if (!job?.jobId) return;
    if (job.status === "COMPLETED" || job.status === "FAILED") return;

    pollRef.current = setInterval(async () => {
      const status = await getImportJobStatus(job.jobId);
      if (status) {
        setJob(status);
        if (status.status === "COMPLETED" || status.status === "FAILED") {
          setIsUploading(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [job?.jobId, job?.status]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = event.target.files?.[0];
    setError(null);
    if (!selected) return;

    if (!selected.name.endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }

    try {
      const text = await selected.text();
      setFile(selected);
      setFileContent(text);
    } catch {
      setError("Failed to read file.");
    }
  };

  const handleUpload = async () => {
    if (!file || !fileContent) return;
    setIsUploading(true);
    setError(null);

    const result = await startStockImport(fileContent, file.name);

    if ("responseType" in result && result.responseType === "error") {
      setError((result as any).message || "Import failed");
      setIsUploading(false);
      return;
    }

    setJob(result as CsvImportJobResponse);
  };

  const isComplete = job?.status === "COMPLETED";
  const isFailed = job?.status === "FAILED";
  const isProcessing =
    isUploading && (job?.status === "PENDING" || job?.status === "PROCESSING");

  const progressValue = !job
    ? 0
    : job.status === "PENDING"
      ? 10
      : job.status === "PROCESSING"
        ? 50
        : 100;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isProcessing) setIsOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="h-10 gap-1"
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
        >
          <FileUp className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Import Stock
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Stock Items</DialogTitle>
          <DialogDescription>
            Upload a CSV file with stock items. Required columns: name,
            base_unit. Optional: description, variant_name, variant_unit, sku,
            conversion_to_base, quantity, unit_cost.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* File input */}
          {!isProcessing && !isComplete && (
            <div className="flex items-center gap-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex-1"
              />
              {file && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  disabled={isUploading}
                >
                  Clear
                </Button>
              )}
            </div>
          )}

          {/* Error */}
          {(error || isFailed) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error || job?.errorMessage || "Import failed"}
              </AlertDescription>
            </Alert>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="space-y-2 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {job?.status === "PENDING"
                    ? "Starting import..."
                    : "Processing..."}
                </span>
              </div>
              <Progress value={progressValue} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Please do not close this window
              </p>
            </div>
          )}

          {/* Success */}
          {isComplete && job && (
            <div className="space-y-3">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-300">
                  Import Complete
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {job.stocksCreated} stock items created with{" "}
                  {job.variantsCreated} variants.
                  {job.failureCount > 0 &&
                    ` ${job.failureCount} rows had errors.`}
                  {job.openingStockItems > 0 &&
                    ` Opening stock created for ${job.openingStockItems} items.`}
                </AlertDescription>
              </Alert>

              {/* Errors list */}
              {job.errors.length > 0 && (
                <div className="border border-red-200 rounded-md p-3 bg-red-50 dark:bg-red-950/30 dark:border-red-800 max-h-40 overflow-auto">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                    Row Errors
                  </h4>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {job.errors.map((e, i) => (
                      <li
                        key={i}
                        className="text-xs text-red-700 dark:text-red-400"
                      >
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isComplete || isFailed ? (
            <Button onClick={() => setIsOpen(false)}>
              <Check className="h-4 w-4 mr-1.5" />
              Done
            </Button>
          ) : (
            !isProcessing && (
              <Button
                onClick={handleUpload}
                disabled={!file || !fileContent || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1.5" />
                    Upload CSV
                  </>
                )}
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
