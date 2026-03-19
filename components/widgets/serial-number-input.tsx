"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Barcode,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Keyboard,
  ScanLine,
  X,
} from "lucide-react";

interface UniqueIdentifierInputProps {
  quantity: number;
  value: string[];
  onChange: (serials: string[]) => void;
  disabled?: boolean;
  showErrors?: boolean;
}

export function UniqueIdentifierInput({
  quantity,
  value,
  onChange,
  disabled = false,
  showErrors = false,
}: UniqueIdentifierInputProps) {
  const [serials, setSerials] = useState<string[]>(() =>
    Array.from({ length: quantity }, (_, i) => value[i] ?? ""),
  );
  const [scanMode, setScanMode] = useState<"manual" | "usb" | "camera">("manual");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [scanBuffer, setScanBuffer] = useState("");
  const [usbDuplicateWarning, setUsbDuplicateWarning] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const scanBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const html5QrcodeRef = useRef<any>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });
  // Keep a live ref to serials so the keydown handler can read it without
  // going stale inside the event listener closure.
  const serialsRef = useRef<string[]>(serials);
  const scannerDivId = "serial-qr-scanner";

  // Keep serialsRef in sync
  useEffect(() => {
    serialsRef.current = serials;
  }, [serials]);

  // Resize serials array when quantity changes
  useEffect(() => {
    setSerials((prev) =>
      Array.from({ length: quantity }, (_, i) => prev[i] ?? ""),
    );
    inputRefs.current = inputRefs.current.slice(0, quantity);
  }, [quantity]);

  // Sync upward
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current(serials);
  }, [serials]);

  // ── USB scanner: global keydown listener ──────────────────────────────────
  useEffect(() => {
    if (scanMode !== "usb" || activeIndex === null || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const scanned = scanBufferRef.current.trim();
        scanBufferRef.current = "";
        setScanBuffer("");

        if (!scanned || activeIndex === null) return;

        // ── Duplicate guard ─────────────────────────────────────────
        // Read the live array from the ref so we're never looking at a
        // stale closure snapshot.
        const current = serialsRef.current;
        const isDuplicate = current.some(
          (s, i) => i !== activeIndex && s.trim() === scanned,
        );

        if (isDuplicate) {
          // Briefly highlight the input red and show a warning banner
          const inputEl = inputRefs.current[activeIndex];
          if (inputEl) {
            inputEl.style.transition = "background 0.15s";
            inputEl.style.background = "#fee2e2"; // red-100
            setTimeout(() => { inputEl.style.background = ""; }, 1400);
          }
          setUsbDuplicateWarning(
            `"${scanned}" is already entered — scan a different barcode`,
          );
          setTimeout(() => setUsbDuplicateWarning(null), 3000);
          return; // do NOT write to serials, do NOT advance
        }

        // ── Write and advance ───────────────────────────────────────
        setSerials((prev) => {
          const next = [...prev];
          next[activeIndex] = scanned;
          return next;
        });

        // Advance to next empty field after the current one
        const nextEmpty = current.findIndex(
          (s, i) => i > activeIndex && s === "",
        );
        if (nextEmpty !== -1) {
          setActiveIndex(nextEmpty);
          setTimeout(() => inputRefs.current[nextEmpty]?.focus(), 50);
        } else {
          setActiveIndex(null);
        }

        return;
      }

      // Accumulate scanner characters (they arrive < 80ms apart)
      if (
        e.key.length === 1 &&
        (timeDiff < 80 || scanBufferRef.current.length > 0)
      ) {
        scanBufferRef.current += e.key;
        setScanBuffer(scanBufferRef.current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scanMode, activeIndex, disabled]);

  // ── Camera scanner: start/stop html5-qrcode ───────────────────────────────
  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return;
    }
    startCamera();
    return () => { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      await stopCamera();
      const { Html5Qrcode } = await import("html5-qrcode");
      await new Promise((r) => setTimeout(r, 300));

      const scanner = new Html5Qrcode(scannerDivId, { verbose: false });
      html5QrcodeRef.current = scanner;

      const config = { fps: 10, qrbox: { width: 250, height: 150 } };

      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError(
          window.location.protocol === "http:" && window.location.hostname !== "localhost"
            ? "Camera requires a secure (HTTPS) connection."
            : "Camera is not supported in this browser.",
        );
        return;
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch (mediaErr: any) {
        setCameraError(
          mediaErr?.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access in your browser settings."
            : mediaErr?.name === "NotFoundError"
              ? "No camera found on this device."
              : `Camera error: ${mediaErr?.message || mediaErr}`,
        );
        return;
      } finally {
        if (stream) stream.getTracks().forEach((t) => t.stop());
      }

      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length === 0) { setCameraError("No camera found on this device."); return; }

      const backCamera =
        cameras.find((c) => /back|rear|environment/i.test(c.label)) ||
        cameras[cameras.length - 1];

      try {
        await scanner.start(backCamera.id, config, handleCameraScan, () => {});
      } catch {
        await scanner.start({ facingMode: "environment" }, config, handleCameraScan, () => {});
      }
    } catch (err: any) {
      setCameraError(`Camera error: ${err?.message || err}`);
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrcodeRef.current) {
        if (html5QrcodeRef.current.isScanning) await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      }
    } catch {}
    html5QrcodeRef.current = null;
  };

  const handleCameraScan = useCallback((code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // Time-based deduplication (same code within 2s)
    const now = Date.now();
    if (
      lastScannedRef.current.code === trimmed &&
      now - lastScannedRef.current.time < 2000
    ) return;
    lastScannedRef.current = { code: trimmed, time: now };

    setSerials((prev) => {
      // Value-based duplicate guard — same as USB
      const targetIdx = prev.findIndex((s) => s === "");
      if (targetIdx === null || targetIdx === -1) return prev;

      const isDuplicate = prev.some(
        (s, i) => i !== targetIdx && s.trim() === trimmed,
      );
      if (isDuplicate) return prev; // silently skip (camera fires continuously)

      const next = [...prev];
      next[targetIdx] = trimmed;

      const nextEmpty = next.findIndex((s, i) => i > targetIdx && s === "");
      setActiveIndex(nextEmpty !== -1 ? nextEmpty : null);

      if (next.every((s) => s.trim() !== "")) setCameraOpen(false);

      return next;
    });
  }, []);

  const handleManualChange = useCallback((index: number, val: string) => {
    setSerials((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  }, []);

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

  const clearSerial = useCallback((index: number) => {
    setSerials((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  }, []);

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
    <div className="mt-6 border border-primary/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary/5 border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Barcode className="h-5 w-5 text-primary" />
          <span className="font-semibold text-gray-800 text-sm">Unique Identifiers</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-primary/20 rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => { setScanMode("manual"); setCameraOpen(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                scanMode === "manual" ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Keyboard className="h-3.5 w-3.5" /> Manual
            </button>
            <button
              type="button"
              onClick={() => {
                setScanMode("usb");
                setCameraOpen(false);
                setUsbDuplicateWarning(null);
                const firstEmpty = serials.findIndex((s) => s === "");
                const idx = firstEmpty !== -1 ? firstEmpty : 0;
                setActiveIndex(idx);
                setTimeout(() => inputRefs.current[idx]?.focus(), 50);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                scanMode === "usb" ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Barcode className="h-3.5 w-3.5" /> USB
            </button>
            <button
              type="button"
              onClick={() => {
                setScanMode("camera");
                setCameraOpen(true);
                const firstEmpty = serials.findIndex((s) => s === "");
                setActiveIndex(firstEmpty !== -1 ? firstEmpty : 0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                scanMode === "camera" ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Camera className="h-3.5 w-3.5" /> Camera
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

      {/* USB scan mode banner */}
      {scanMode === "usb" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-sm text-amber-800">
          <Barcode className="h-4 w-4 shrink-0" />
          <span>
            USB scanner mode — scan barcode with USB scanner.
            {activeIndex !== null && (
              <strong> Scanning into field #{activeIndex + 1}</strong>
            )}
            {scanBuffer && !usbDuplicateWarning && (
              <span className="ml-2 font-mono bg-amber-100 px-2 py-0.5 rounded text-amber-900">
                {scanBuffer}▌
              </span>
            )}
          </span>
        </div>
      )}

      {/* USB duplicate warning banner */}
      {scanMode === "usb" && usbDuplicateWarning && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-sm text-red-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {usbDuplicateWarning}
        </div>
      )}

      {/* Camera scanner panel */}
      {scanMode === "camera" && cameraOpen && (
        <div className="border-b border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <ScanLine className="h-4 w-4" />
              Camera scanning
              {activeIndex !== null && (
                <span className="text-primary/80"> → filling field #{activeIndex + 1}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCameraOpen(false)}
              className="text-primary/40 hover:text-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {cameraError ? (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {cameraError}
            </div>
          ) : (
            <div
              id={scannerDivId}
              className="rounded-lg overflow-hidden max-w-sm mx-auto"
              style={{ minHeight: 200 }}
            />
          )}

          <p className="text-xs text-primary/70 mt-2 text-center">
            Point your phone camera at a barcode — it will auto-fill and advance to the next field
          </p>
        </div>
      )}

      {/* Re-open camera button */}
      {scanMode === "camera" && !cameraOpen && filled < quantity && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">Camera scanner paused</span>
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="text-xs bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            <Camera className="h-3.5 w-3.5" /> Resume scanning
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1 bg-primary/10">
        <div
          className="h-full bg-primary transition-all duration-300"
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
          const hasError = showErrors && !isFilled;

          return (
            <div key={index} className="relative">
              <label className={`text-xs font-medium mb-1 block ${hasError ? "text-red-500" : "text-gray-400"}`}>
                #{index + 1}
              </label>
              <div
                className={`flex items-center gap-1 rounded-md overflow-hidden transition-all ${
                  isDuplicate
                    ? "bg-red-100 ring-1 ring-red-400"
                    : hasError
                      ? "bg-red-50 ring-1 ring-red-400"
                      : isActive && scanMode !== "manual"
                        ? "bg-muted ring-1 ring-primary"
                        : "bg-muted"
                }`}
              >
                <input
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  value={serial}
                  onChange={(e) => handleManualChange(index, e.target.value)}
                  onFocus={() => setActiveIndex(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  disabled={disabled}
                  placeholder={
                    isActive && scanMode !== "manual"
                      ? "Awaiting scan..."
                      : `Identifier #${index + 1}`
                  }
                  className={`flex-1 text-sm h-10 px-3 py-2 bg-transparent outline-none placeholder:text-muted-foreground font-mono ${
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
        <div className="border-t border-primary/10 bg-primary/5 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            {filled === quantity ? (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                All {quantity} identifiers entered
              </span>
            ) : (
              `${quantity - filled} remaining`
            )}
          </span>
          {hasDuplicates && (
            <span className="text-red-500 font-medium">
              ⚠ Remove duplicate identifiers before saving
            </span>
          )}
        </div>
      )}
    </div>
  );
}
