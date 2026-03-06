"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Barcode,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Keyboard,
} from "lucide-react";

interface SerialNumberInputProps {
  quantity: number;
  value: string[];
  onChange: (serials: string[]) => void;
  disabled?: boolean;
}

export function SerialNumberInput({
  quantity,
  value,
  onChange,
  disabled = false,
}: SerialNumberInputProps) {
  const [serials, setSerials] = useState<string[]>(() =>
    Array.from({ length: quantity }, (_, i) => value[i] ?? ""),
  );
  const [scanMode, setScanMode] = useState<"manual" | "scan">("manual");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [scanBuffer, setScanBuffer] = useState("");
  const [lastScanTime, setLastScanTime] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const scanBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  // Resize serials array when quantity changes
  useEffect(() => {
    setSerials((prev) => {
      const next = Array.from({ length: quantity }, (_, i) => prev[i] ?? "");
      return next;
    });
    inputRefs.current = inputRefs.current.slice(0, quantity);
  }, [quantity]);

  // Sync upward
  useEffect(() => {
    onChange(serials);
  }, [serials, onChange]);

  // Global keydown listener for barcode scanner (fast keyboard input)
  useEffect(() => {
    if (scanMode !== "scan" || activeIndex === null || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Barcode scanners type very fast (< 50ms between chars)
      if (e.key === "Enter") {
        const scanned = scanBufferRef.current.trim();
        if (scanned && activeIndex !== null) {
          const next = [...serials];
          next[activeIndex] = scanned;
          setSerials(next);
          scanBufferRef.current = "";
          setScanBuffer("");
          // Move to next empty slot
          const nextEmpty = next.findIndex(
            (s, i) => i > activeIndex && s === "",
          );
          if (nextEmpty !== -1) {
            setActiveIndex(nextEmpty);
            setTimeout(() => inputRefs.current[nextEmpty]?.focus(), 50);
          } else {
            setActiveIndex(null);
          }
        }
        return;
      }

      if (e.key.length === 1) {
        // If fast input (scanner), accumulate
        if (timeDiff < 80 || scanBufferRef.current.length > 0) {
          scanBufferRef.current += e.key;
          setScanBuffer(scanBufferRef.current);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scanMode, activeIndex, serials, disabled]);

  const handleManualChange = useCallback(
    (index: number, val: string) => {
      const next = [...serials];
      next[index] = val;
      setSerials(next);
    },
    [serials],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const nextEmpty = serials.findIndex((s, i) => i > index && s === "");
        const nextIndex = nextEmpty !== -1 ? nextEmpty : index + 1;
        if (nextIndex < quantity) {
          inputRefs.current[nextIndex]?.focus();
          setActiveIndex(nextIndex);
        }
      }
    },
    [serials, quantity],
  );

  const clearSerial = useCallback(
    (index: number) => {
      const next = [...serials];
      next[index] = "";
      setSerials(next);
    },
    [serials],
  );

  const clearAll = useCallback(() => {
    setSerials(Array.from({ length: quantity }, () => ""));
  }, [quantity]);

  const filled = serials.filter((s) => s.trim() !== "").length;
  const duplicates = serials
    .filter((s) => s.trim() !== "")
    .filter((s, i, arr) => arr.indexOf(s) !== i);
  const hasDuplicates = duplicates.length > 0;

  if (quantity <= 0) return null;

  return (
    <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Barcode className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-800 text-sm">
            Serial / Batch Numbers
          </span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {filled}/{quantity} entered
          </span>
          {hasDuplicates && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Duplicates found
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setScanMode("manual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                scanMode === "manual"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Keyboard className="h-3.5 w-3.5" />
              Manual
            </button>
            <button
              type="button"
              onClick={() => {
                setScanMode("scan");
                // focus first empty
                const firstEmpty = serials.findIndex((s) => s === "");
                const idx = firstEmpty !== -1 ? firstEmpty : 0;
                setActiveIndex(idx);
                setTimeout(() => inputRefs.current[idx]?.focus(), 50);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                scanMode === "scan"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              Scan
            </button>
          </div>

          <button
            type="button"
            onClick={clearAll}
            disabled={disabled || filled === 0}
            className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors px-2 py-1"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Scan mode banner */}
      {scanMode === "scan" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-sm text-amber-800">
          <Camera className="h-4 w-4 shrink-0" />
          <span>
            Scan mode active — point scanner at barcode.
            {activeIndex !== null && (
              <strong> Scanning into field #{activeIndex + 1}</strong>
            )}
            {scanBuffer && (
              <span className="ml-2 font-mono bg-amber-100 px-2 py-0.5 rounded text-amber-900">
                {scanBuffer}▌
              </span>
            )}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${(filled / quantity) * 100}%` }}
        />
      </div>

      {/* Grid of inputs */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
        {serials.map((serial, index) => {
          const isDuplicate =
            serial.trim() !== "" &&
            serials.some((s, i) => i !== index && s.trim() === serial.trim());
          const isFilled = serial.trim() !== "";
          const isActive = activeIndex === index;

          return (
            <div key={index} className="relative">
              <label className="text-xs text-gray-400 font-medium mb-1 block">
                #{index + 1}
              </label>
              <div
                className={`flex items-center gap-1 border rounded-lg overflow-hidden transition-all ${
                  isDuplicate
                    ? "border-red-400 bg-red-50"
                    : isActive && scanMode === "scan"
                      ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50"
                      : isFilled
                        ? "border-green-400 bg-green-50"
                        : "border-gray-200 bg-white"
                }`}
              >
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  value={serial}
                  onChange={(e) => handleManualChange(index, e.target.value)}
                  onFocus={() => setActiveIndex(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  disabled={disabled}
                  placeholder={
                    scanMode === "scan" && isActive
                      ? "Awaiting scan..."
                      : `Serial #${index + 1}`
                  }
                  className={`flex-1 text-sm px-3 py-2 bg-transparent outline-none placeholder:text-gray-300 font-mono ${
                    disabled ? "cursor-not-allowed opacity-60" : ""
                  }`}
                />
                {isFilled && !disabled && (
                  <button
                    type="button"
                    onClick={() => clearSerial(index)}
                    className="pr-2 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
                {isFilled && !isDuplicate && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                )}
                {isDuplicate && (
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2 shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      {filled > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            {filled === quantity ? (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                All {quantity} serials entered
              </span>
            ) : (
              `${quantity - filled} remaining`
            )}
          </span>
          {hasDuplicates && (
            <span className="text-red-500 font-medium">
              ⚠ Remove duplicate serial numbers before saving
            </span>
          )}
        </div>
      )}
    </div>
  );
}
