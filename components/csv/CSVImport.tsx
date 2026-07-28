"use client";

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
import { useCSVUpload } from "@/hooks/uploadProduct";
import SubmitButton from "../widgets/submit-button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { checkTaskStatus } from "@/lib/actions/stock-actions";

// CSV Header and Validation Configuration
const CSV_CONFIG = {
  expectedHeaders: [
    "Product Name",
    "Category Name",
    "Variant Name",
    "Price",
    "SKU",
    "Barcode",
    "Department",
  ],
  requiredFields: ["Product Name", "Category Name", "Variant Name", "Price"],
  textFields: ["Product Name", "Category Name", "Variant Name", "Department"],
  numericFields: {
    Price: { min: 0.01, allowZero: false },
  },
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rows: string[][];
};
type TaskStatus = "idle" | "processing" | "complete" | "failed" | "error";
type DialogView =
  | "upload"
  | "processing"
  | "success"
  | "error"
  | "confirm-close";

const validateNumericField = (
  value: string,
  fieldName: string,
  config: { min: number; allowZero: boolean },
  rowIndex: number,
): string | null => {
  const num = parseFloat(value.trim());
  if (isNaN(num))
    return `Row ${rowIndex}: "${fieldName}" must be a valid number.`;
  if (!config.allowZero && num <= 0)
    return `Row ${rowIndex}: "${fieldName}" must be greater than zero.`;
  if (config.allowZero && num < 0)
    return `Row ${rowIndex}: "${fieldName}" cannot be less than zero.`;

  // Check if price is a whole number
  if (fieldName === "Price" && !Number.isInteger(num)) {
    return `Row ${rowIndex}: "${fieldName}" must be a whole number without decimals`;
  }

  return null;
};

const validateSKU = (value: string, rowIndex: number): string | null => {
  if (!value.trim()) return null;
  if (value.length > 50) {
    return `Row ${rowIndex}: SKU is longer than 50 characters (warning)`;
  }
  return null;
};

const validateBarcode = (value: string, rowIndex: number): string | null => {
  if (!value.trim()) return null;
  if (!/^[0-9]+$/.test(value)) {
    return `Row ${rowIndex}: Barcode "${value}" should only contain numbers (warning)`;
  }
  return null;
};

const validateCSV = (
  fileContent: string,
  config = CSV_CONFIG,
): ValidationResult => {
  const lines = fileContent.trim().split("\n").filter(Boolean);
  const rows: string[][] = lines.map((line) =>
    line.split(",").map((cell) => cell.trim()),
  );
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rows.length === 0)
    return {
      isValid: false,
      errors: ["The file is empty."],
      warnings: [],
      rows: [],
    };
  if (rows.length === 1)
    return {
      isValid: false,
      errors: ["The file only contains headers but no data."],
      warnings: [],
      rows,
    };

  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}|\u{2700}-\u{27BF}|\u{2600}-\u{26FF}]/gu;
  const headers = rows[0];
  const missingHeaders = config.expectedHeaders.filter(
    (h) => !headers.includes(h),
  );
  if (missingHeaders.length > 0) {
    return {
      isValid: false,
      errors: [`Missing required headers: ${missingHeaders.join(", ")}`],
      warnings: [],
      rows,
    };
  }

  // Check for duplicate product combinations
  const productDuplicates = new Map<string, number[]>();
  const pni = headers.indexOf("Product Name"),
    vni = headers.indexOf("Variant Name");

  rows.slice(1).forEach((row, i) => {
    const ri = i + 2;
    const pk = `${row[pni]?.trim().toLowerCase()}|||${row[vni]?.trim().toLowerCase()}`;
    productDuplicates.set(pk, [...(productDuplicates.get(pk) || []), ri]);
  });

  productDuplicates.forEach((idxs, key) => {
    if (idxs.length > 1) {
      const [p, v] = key.split("|||");
      errors.push(
        `Duplicate product in rows ${idxs.join(", ")}: "${p}" + "${v}"`,
      );
    }
  });

  rows.slice(1).forEach((row, rowIndex) => {
    const ri = rowIndex + 2;
    if (row.length !== headers.length) {
      errors.push(
        `Row ${ri}: Expected ${headers.length} columns, found ${row.length}.`,
      );
    }

    config.textFields.forEach((field) => {
      const fi = headers.indexOf(field);
      if (fi !== -1 && row[fi] && emojiRegex.test(row[fi].trim())) {
        errors.push(
          `Row ${ri}: "${field}" contains emojis which are not allowed.`,
        );
      }
    });

    config.requiredFields.forEach((field) => {
      const fi = headers.indexOf(field);
      if (fi !== -1 && (!row[fi] || row[fi].trim() === "")) {
        errors.push(`Row ${ri}: "${field}" cannot be empty.`);
      }
    });

    Object.entries(config.numericFields).forEach(([field, cfg]) => {
      const fi = headers.indexOf(field);
      if (fi !== -1 && row[fi]) {
        const err = validateNumericField(row[fi], field, cfg, ri);
        if (err) errors.push(err);
      }
    });

    // SKU validation (warning)
    const skuIndex = headers.indexOf("SKU");
    if (skuIndex !== -1 && row[skuIndex]) {
      const warning = validateSKU(row[skuIndex], ri);
      if (warning) warnings.push(warning);
    }

    // Barcode validation (warning)
    const barcodeIndex = headers.indexOf("Barcode");
    if (barcodeIndex !== -1 && row[barcodeIndex]) {
      const warning = validateBarcode(row[barcodeIndex], ri);
      if (warning) warnings.push(warning);
    }
  });

  return { isValid: errors.length === 0, errors, warnings, rows };
};

// Step indicator for upload view
const StepIndicator = ({
  step,
  label,
  status,
}: {
  step: number;
  label: string;
  status: "done" | "active" | "pending";
}) => (
  <div className="flex items-center gap-2">
    <div
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
        status === "done" && "bg-emerald-500 text-white",
        status === "active" &&
          "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
        status === "pending" && "bg-muted text-muted-foreground",
      )}
    >
      {status === "done" ? (
        <Icon icon="mdi:check" className="h-3.5 w-3.5" />
      ) : (
        step
      )}
    </div>
    <span
      className={cn(
        "text-xs font-medium hidden sm:block",
        status === "active" && "text-foreground",
        status !== "active" && "text-muted-foreground",
      )}
    >
      {label}
    </span>
  </div>
);

const StepDivider = () => (
  <div className="h-px flex-1 bg-border hidden sm:block" />
);

export function ProductCSVDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<DialogView>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("idle");
  const [taskMessage, setTaskMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { uploadProgress, error, uploadCSV, isUploading, resetUpload } =
    useCSVUpload();

  const resetForm = () => {
    setFile(null);
    setFileContent(null);
    setValidationResult(null);
    setTaskId(null);
    setTaskStatus("idle");
    setTaskMessage(null);
    setIsPolling(false);
    setCurrentView("upload");
    resetUpload();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (taskStatus === "processing") {
      setCurrentView("confirm-close");
      return;
    }
    setIsOpen(false);
    resetForm();
  };

  const handleBackgroundProcessing = () => {
    toast({
      title: "Processing in Background",
      description: "Your upload will continue processing.",
    });
    resetForm();
    setIsOpen(false);
    setTimeout(() => window.location.reload(), 300);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const poll = async () => {
      if (!taskId || !isPolling) return;
      try {
        const status = await checkTaskStatus(taskId);
        setTaskStatus(status.csv_upload_status as TaskStatus);
        setTaskMessage(status.message);
        if (status.csv_upload_status === "complete") {
          setIsPolling(false);
          setCurrentView("success");
          if (interval) clearInterval(interval);
        } else if (status.csv_upload_status === "failed") {
          setIsPolling(false);
          setCurrentView("error");
          if (interval) clearInterval(interval);
        }
      } catch {
        setTaskStatus("error");
        setTaskMessage("Failed to check task status");
        setIsPolling(false);
        setCurrentView("error");
        if (interval) clearInterval(interval);
      }
    };
    if (taskId && isPolling) {
      poll();
      interval = setInterval(poll, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [taskId, isPolling]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    try {
      const fileText = await selectedFile.text();
      const result = validateCSV(fileText);
      setValidationResult(result);
      setFile(selectedFile);
      if (result.isValid) {
        setFileContent(result.rows.map((r) => r.join(",")).join("\n"));
        toast({
          title: "File Validated",
          description: `${result.rows.length - 1} products ready to upload.`,
          variant: "success",
        });

        // Show warning toast if there are warnings
        if (result.warnings && result.warnings.length > 0) {
          toast({
            title: "Validation Warnings",
            description: `${result.warnings.length} non-critical issues found.`,
            variant: "default",
          });
        }
      } else {
        setFileContent(null);
        toast({
          title: "Validation Failed",
          description: `${result.errors.length} issues found.`,
          variant: "destructive",
        });
      }
    } catch {
      setValidationResult({
        isValid: false,
        errors: ["Failed to process the file."],
        warnings: [],
        rows: [],
      });
      toast({
        title: "Error",
        description: "Failed to process the file.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!file || !fileContent || !validationResult?.isValid) return;
    try {
      const response = await uploadCSV({
        fileData: fileContent,
        fileName: file.name,
      });
    } catch (err: any) {
      const message =
        err?.message ||
        "There was an error uploading your file. Please try again.";
      setTaskStatus("error");
      setTaskMessage(message);
      setCurrentView("error");
      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleTemplateDownload = () => {
    fetch("/csv/product-csv-template.csv")
      .then((res) => {
        if (res.ok) {
          window.open("/csv/product-csv-template.csv", "_blank");
          toast({ title: "Template Downloaded" });
        } else
          toast({
            title: "Download Failed",
            description: "Template not found.",
            variant: "destructive",
          });
      })
      .catch(() =>
        toast({
          title: "Download Failed",
          description: "Failed to download template.",
          variant: "destructive",
        }),
      );
  };

  const handleSuccessClose = () => {
    toast({
      title: "Upload Successful",
      description: "Products have been uploaded successfully.",
    });
    resetForm();
    setIsOpen(false);
    setTimeout(() => window.location.reload(), 300);
  };

  const productCount = validationResult?.rows?.length
    ? validationResult.rows.length - 1
    : 0;

  const ErrorList = ({
    errors,
    warnings,
  }: {
    errors: string[];
    warnings: string[];
  }) => {
    const allIssues = [...errors, ...warnings];
    if (!allIssues.length) return null;

    const rowRegex = /Row (\d+):/;
    const grouped: Record<string, { errors: string[]; warnings: string[] }> =
      {};

    allIssues.forEach((issue) => {
      const isWarning = warnings.includes(issue);
      const key = issue.match(rowRegex)?.[1]
        ? `Row ${issue.match(rowRegex)![1]}`
        : "General";

      if (!grouped[key]) {
        grouped[key] = { errors: [], warnings: [] };
      }

      if (isWarning) {
        grouped[key].warnings.push(issue);
      } else {
        grouped[key].errors.push(issue);
      }
    });

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-red-200 dark:border-red-900 px-3 py-2 bg-red-100/50 dark:bg-red-900/20">
          <Icon
            icon="mdi:alert-circle"
            className="h-4 w-4 text-red-500 shrink-0"
          />
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-400">
            {errors.length} Error{errors.length !== 1 ? "s" : ""}
            {warnings.length > 0 &&
              ` • ${warnings.length} Warning${warnings.length !== 1 ? "s" : ""}`}
          </h4>
        </div>
        <div className="max-h-48 overflow-y-auto p-3 space-y-3">
          {Object.entries(grouped).map(([rowKey, issues]) => (
            <div key={rowKey}>
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                {rowKey}
              </p>
              <ul className="space-y-0.5">
                {issues.errors.map((err, i) => (
                  <li
                    key={`err-${i}`}
                    className="text-xs text-red-600 dark:text-red-300 flex items-start gap-1.5"
                  >
                    <span className="mt-0.5 shrink-0">•</span>
                    <span className="font-medium">Error:</span>
                    <span>{err.replace(rowRegex, "").trim()}</span>
                  </li>
                ))}
                {issues.warnings.map((warn, i) => (
                  <li
                    key={`warn-${i}`}
                    className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5"
                  >
                    <span className="mt-0.5 shrink-0">•</span>
                    <span className="font-medium">Warning:</span>
                    <span>{warn.replace(rowRegex, "").trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDialogContent = () => {
    switch (currentView) {
      case "processing":
        return (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg">
                Processing Your Upload
              </DialogTitle>
              <DialogDescription>
                Sit tight — we&apos;re importing your products.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 flex flex-col items-center gap-5">
              <div className="relative flex items-center justify-center h-20 w-20">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                <Icon
                  icon="mdi:cloud-upload"
                  className="h-8 w-8 text-primary"
                />
              </div>
              <div className="text-center space-y-1 max-w-xs">
                <p className="text-sm font-medium">
                  Processing your product upload
                </p>
                <p className="text-xs text-muted-foreground">
                  This may take a few moments. You can continue working in the
                  background.
                </p>
              </div>
              <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full animate-[progress_2s_ease-in-out_infinite]"
                  style={{
                    animation: "indeterminate 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                onClick={handleBackgroundProcessing}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Continue in Background
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  handleBackgroundProcessing();
                  setTimeout(() => {
                    window.location.href = "/products";
                  }, 800);
                }}
              >
                <Icon icon="mdi:arrow-right" className="mr-1.5 h-4 w-4" />
                Go to Products
              </Button>
            </DialogFooter>
          </>
        );

      case "success":
        return (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg">Upload Complete</DialogTitle>
              <DialogDescription>
                Your products have been successfully imported.
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <Icon
                  icon="mdi:check-circle"
                  className="h-10 w-10 text-emerald-500"
                />
              </div>
              <div className="text-center space-y-1 max-w-xs">
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  All done!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your data is live. Refresh to see the updated product list or
                  head to Products.
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                onClick={handleSuccessClose}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Close & Refresh
              </Button>
              <Button
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  setTimeout(() => {
                    window.location.href = "/products";
                  }, 300);
                }}
              >
                <Icon icon="mdi:package-variant" className="mr-1.5 h-4 w-4" />
                View Products
              </Button>
            </DialogFooter>
          </>
        );

      case "error":
        return (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg">Upload Failed</DialogTitle>
              <DialogDescription>
                We encountered an issue while processing your file.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-red-50 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-800 flex items-center justify-center">
                <Icon
                  icon="mdi:alert-circle"
                  className="h-10 w-10 text-red-500"
                />
              </div>
              <div className="w-full rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3">
                <p className="text-sm text-red-700 dark:text-red-300 text-center leading-relaxed">
                  {taskMessage ||
                    "Failed to process product upload. Please try again."}
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                onClick={() => setCurrentView("upload")}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Icon icon="mdi:arrow-left" className="mr-1.5 h-4 w-4" />
                Try Again
              </Button>
            </DialogFooter>
          </>
        );

      case "confirm-close":
        return (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg">
                Upload Still in Progress
              </DialogTitle>
              <DialogDescription>
                Your file is being processed. What would you like to do?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4 flex gap-3">
                <Icon
                  icon="mdi:information"
                  className="h-5 w-5 text-amber-500 shrink-0 mt-0.5"
                />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Closing won&apos;t cancel the upload. Processing will continue
                  and your products will appear shortly.
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                onClick={() => setCurrentView("processing")}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Keep Watching
              </Button>
              <Button
                onClick={handleBackgroundProcessing}
                className="w-full sm:w-auto"
              >
                Continue in Background
              </Button>
            </DialogFooter>
          </>
        );

      default: // upload
        return (
          <>
            <div className="px-4 sm:px-6 pt-5 pb-3 border-b border-border shrink-0">
              <DialogHeader className="space-y-0.5">
                <DialogTitle className="text-base font-semibold">
                  Import Products CSV
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Upload a CSV file to bulk-import products with variants and
                  pricing.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-2 mt-3">
                <StepIndicator
                  step={1}
                  label="Select File"
                  status={file ? "done" : "active"}
                />
                <StepDivider />
                <StepIndicator
                  step={2}
                  label="Validate"
                  status={
                    !file
                      ? "pending"
                      : validationResult?.isValid
                        ? "done"
                        : "active"
                  }
                />
                <StepDivider />
                <StepIndicator
                  step={3}
                  label="Upload"
                  status={validationResult?.isValid ? "active" : "pending"}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 min-h-0">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="csv" className="text-sm font-medium">
                    CSV File
                  </label>
                  <Button
                    onClick={handleTemplateDownload}
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground"
                  >
                    <Icon
                      icon="mdi:file-download-outline"
                      className="h-3.5 w-3.5"
                    />
                    Template
                  </Button>
                </div>

                <label
                  htmlFor="csv"
                  className={cn(
                    "flex items-center gap-3 w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors px-4 py-3",
                    file && validationResult?.isValid
                      ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                      : file && !validationResult?.isValid
                        ? "border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/30",
                  )}
                >
                  <Icon
                    icon={
                      file && validationResult?.isValid
                        ? "mdi:file-check"
                        : file
                          ? "mdi:file-alert"
                          : "mdi:file-upload-outline"
                    }
                    className={cn(
                      "h-7 w-7 shrink-0",
                      file && validationResult?.isValid
                        ? "text-emerald-500"
                        : file
                          ? "text-red-400"
                          : "text-muted-foreground",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    {file ? (
                      <>
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">
                          Click to select a CSV file
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Required: Product Name, Category, Variant, Price
                        </p>
                      </>
                    )}
                  </div>
                  {file && (
                    <Icon
                      icon={
                        validationResult?.isValid
                          ? "mdi:check-circle"
                          : "mdi:alert-circle"
                      }
                      className={cn(
                        "h-5 w-5 shrink-0",
                        validationResult?.isValid
                          ? "text-emerald-500"
                          : "text-red-400",
                      )}
                    />
                  )}
                  <Input
                    ref={fileInputRef}
                    id="csv"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Validation errors and warnings */}
              {validationResult &&
                (!validationResult.isValid ||
                  (validationResult.warnings &&
                    validationResult.warnings.length > 0)) && (
                  <ErrorList
                    errors={validationResult.errors}
                    warnings={validationResult.warnings || []}
                  />
                )}

              {/* Preview table */}
              {validationResult?.isValid &&
                validationResult.rows.length > 1 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Preview
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {productCount} rows
                      </span>
                    </div>
                    <div className="overflow-auto max-h-36 rounded-lg border border-border">
                      <table className="min-w-full text-xs">
                        <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                          <tr>
                            {validationResult.rows[0]?.map((header, i) => (
                              <th
                                key={i}
                                className="px-3 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap border-b border-border"
                              >
                                {header}
                                {CSV_CONFIG.requiredFields.includes(header) && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {validationResult.rows.slice(1, 5).map((row, ri) => (
                            <tr
                              key={ri}
                              className="hover:bg-muted/40 transition-colors"
                            >
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  className="px-3 py-1.5 text-foreground whitespace-nowrap"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {validationResult.rows.length > 5 && (
                            <tr>
                              <td
                                colSpan={validationResult.rows[0].length}
                                className="px-3 py-1.5 text-muted-foreground italic text-center"
                              >
                                +{validationResult.rows.length - 5} more rows
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Upload progress */}
              {uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Uploading</span>
                    <span className="font-semibold tabular-nums">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* API error */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3 py-2">
                  <Icon
                    icon="mdi:alert-circle"
                    className="h-4 w-4 text-red-500 shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {/* Ready banner */}
              {validationResult?.isValid && productCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
                  <Icon
                    icon="mdi:check-circle"
                    className="h-4 w-4 text-emerald-500 shrink-0"
                  />
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Ready to upload <strong>{productCount}</strong> product
                    {productCount !== 1 ? "s" : ""}.
                    {validationResult?.warnings &&
                      validationResult.warnings.length > 0 && (
                        <span className="ml-2 text-amber-600">
                          ({validationResult.warnings.length} warning
                          {validationResult.warnings.length !== 1 ? "s" : ""})
                        </span>
                      )}
                  </p>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border px-4 sm:px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 bg-background">
              <Button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <SubmitButton
                label="Upload CSV"
                isPending={isUploading}
                isDisabled={!file || !validationResult?.isValid || isUploading}
                onClick={handleUpload}
              />
            </div>
          </>
        );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else setIsOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="h-9 gap-1.5 dark:bg-white dark:text-black"
          size="sm"
          variant="outline"
        >
          <Icon className="h-4 w-4 shrink-0" icon="mdi:file-import" />
          <span className="hidden sm:inline whitespace-nowrap">Import CSV</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
