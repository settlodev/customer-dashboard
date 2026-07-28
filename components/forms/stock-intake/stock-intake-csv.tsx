"use client";

import { useRef, useState } from "react";
import React from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  X,
  AlertCircle,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCSVUpload } from "@/hooks/uploadStockIntake";

// ─── Validation ───────────────────────────────────────────────────────────────

const EXPECTED_HEADERS = [
  "Stock Name",
  "Stock Variant Name",
  "Value",
  "Quantity",
  "Expiry Date",
  "Identifier",
];

const validateCSV = (
  fileContent: string,
  expectedHeaders: string[],
): { isValid: boolean; errors: string[]; rows: string[][] } => {
  const lines = fileContent.split("\n").filter(Boolean);
  const rows: string[][] = lines.map((line) =>
    line.split(",").map((cell) => cell.trim().replace(/\s+/g, " ")),
  );
  const errors: string[] = [];

  if (rows.length === 0)
    return { isValid: false, errors: ["The file is empty."], rows: [] };

  const headers = rows[0];
  const missing = expectedHeaders.filter((h) => !headers.includes(h));
  if (missing.length)
    return {
      isValid: false,
      errors: [`Missing required headers: ${missing.join(", ")}`],
      rows: [],
    };

  rows.slice(1).forEach((row, i) => {
    const n = i + 2;
    const get = (col: string) => row[headers.indexOf(col)] ?? "";

    [
      "Stock Name",
      "Stock Variant Name",
      "Value",
      "Quantity",
      "Identifier",
    ].forEach((f) => {
      if (!get(f)) errors.push(`Row ${n}: "${f}" cannot be empty.`);
    });

    const qty = parseFloat(get("Quantity"));
    if (isNaN(qty) || qty < 0)
      errors.push(`Row ${n}: "Quantity" cannot be less than zero.`);

    const val = parseInt(get("Value"), 10);
    if (isNaN(val) || val < 0)
      errors.push(`Row ${n}: "Value" cannot be less than zero.`);

    const exp = get("Expiry Date");
    if (exp) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(exp)) {
        errors.push(`Row ${n}: "Expiry Date" must be in YYYY-MM-DD format.`);
      } else {
        const [y, m, d] = exp.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        if (
          date.getFullYear() !== y ||
          date.getMonth() !== m - 1 ||
          date.getDate() !== d
        )
          errors.push(`Row ${n}: "Expiry Date" is not a valid date.`);
      }
    }

    const id = get("Identifier");
    if (
      id &&
      !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        id,
      )
    )
      errors.push(`Row ${n}: "Identifier" must be a valid UUID.`);
  });

  return { isValid: errors.length === 0, errors, rows };
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StockIntakeCsv() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    rows: string[][];
  } | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadProgress, error, uploadCSV } = useCSVUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const result = validateCSV(text, EXPECTED_HEADERS);
      setValidationResult(result);
      setFile(f);
      setFileContent(
        result.isValid ? result.rows.map((r) => r.join(",")).join("\n") : null,
      );
      setUploadComplete(false);
    } catch {
      setValidationResult({
        isValid: false,
        errors: ["Failed to process the file."],
        rows: [],
      });
    }
  };

  const handleUpload = async () => {
    if (!file || !fileContent || !validationResult?.isValid) return;
    try {
      await uploadCSV({ fileData: fileContent, fileName: file.name });
      setUploadComplete(true);
    } catch {
      /* handled by hook */
    }
  };

  const reset = () => {
    setFile(null);
    setFileContent(null);
    setValidationResult(null);
    setUploadComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    fetch("/csv/stock-template.csv")
      .then((r) => {
        if (r.ok) window.open("/csv/stock-template.csv", "_blank");
        else alert("Template not found");
      })
      .catch(() => alert("Failed to download template"));
  };

  return (
    <div className="space-y-5">
      {/* Template banner */}
      <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl">
        <p className="text-sm text-orange-700 flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 shrink-0" />
          Download the template to ensure your CSV has the correct column
          format.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          className="shrink-0 border-orange-300 text-orange-700 hover:bg-orange-100"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Template
        </Button>
      </div>

      {/* File input */}
      {!isUploading && !uploadComplete && (
        <div className="flex items-center gap-3">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="flex-1"
            disabled={isUploading}
          />
          {file && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={reset}
              className="shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Progress */}
      {isUploading && (
        <div className="space-y-2 py-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Uploading…</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Please do not close this window
          </p>
        </div>
      )}

      {/* Hook error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success */}
      {uploadComplete && (
        <Alert className="bg-green-50 border-green-400">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Stock data has been uploaded successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Validation errors list */}
      {!isUploading &&
        validationResult?.errors &&
        validationResult.errors.length > 0 && (
          <div className="border border-red-200 rounded-xl p-4 bg-red-50 space-y-1">
            <p className="text-sm font-medium text-red-800">
              {validationResult.errors.length} validation error(s)
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              {validationResult.errors.map((e, i) => (
                <li key={i} className="text-xs text-red-700">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Preview table */}
      {!isUploading &&
        validationResult?.rows &&
        validationResult.rows.length > 0 && (
          <div className="overflow-auto max-h-64 border border-gray-200 rounded-xl">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {validationResult.rows[0].map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {validationResult.rows.slice(1).map((row, ri) => (
                  <React.Fragment key={ri}>
                    <tr className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-gray-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                    {validationResult.errors
                      .filter((e) => e.includes(`Row ${ri + 2}`))
                      .map((e, ei) => (
                        <tr key={ei} className="bg-red-50">
                          <td
                            colSpan={row.length}
                            className="px-3 py-1 text-red-600 text-xs"
                          >
                            {e}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Actions */}
      {!isUploading && (
        <div className="flex items-center gap-3 pt-1">
          {uploadComplete ? (
            <Button type="button" onClick={reset} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload another file
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || !validationResult?.isValid || isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
