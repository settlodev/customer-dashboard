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
  const [usbWarning, setUsbWarning] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const scanBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const html5QrcodeRef = useRef<any>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const scannerDivId = "serial-qr-scanner";

  // ── Live refs so the keydown listener never reads stale closures ──────────
  const serialsRef    = useRef<string[]>(serials);
  const activeIdxRef  = useRef<number | null>(activeIndex);
  const scanModeRef   = useRef<"manual" | "usb" | "camera">(scanMode);
  const disabledRef   = useRef<boolean>(disabled);
  // Guard: true while we are in the middle of committing a scan so a second
  // Enter from the same physical trigger cannot sneak through.
  const committingRef = useRef(false);

  useEffect(() => { serialsRef.current   = serials;     }, [serials]);
  useEffect(() => { activeIdxRef.current = activeIndex; }, [activeIndex]);
  useEffect(() => { scanModeRef.current  = scanMode;    }, [scanMode]);
  useEffect(() => { disabledRef.current  = disabled;    }, [disabled]);

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
  useEffect(() => { onChangeRef.current(serials); }, [serials]);

  // ── USB scanner: single global keydown listener, registered once ──────────
  // All state is read through refs so we never need to re-register.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only active in USB mode and not disabled
      if (scanModeRef.current !== "usb" || disabledRef.current) return;

      const now      = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const scanned = scanBufferRef.current.trim();
        scanBufferRef.current = "";
        setScanBuffer("");

        if (!scanned) return;

        const currentActiveIndex = activeIdxRef.current;
        if (currentActiveIndex === null) return;

        // ── Commit guard — prevents double-fire from the same Enter ──
        // If we're already committing (state updates haven't settled yet)
        // discard this second Enter entirely.
        if (committingRef.current) return;
        committingRef.current = true;

        const current = serialsRef.current;

        // ── Duplicate check: is this exact value already in any slot? ──
        const duplicateIndex = current.findIndex(
          (s, i) => i !== currentActiveIndex && s.trim() === scanned,
        );

        if (duplicateIndex !== -1) {
          // Flash the conflicting field red
          const conflictEl = inputRefs.current[duplicateIndex];
          if (conflictEl) {
            conflictEl.style.transition  = "background 0.15s";
            conflictEl.style.background  = "#fee2e2";
            setTimeout(() => { conflictEl.style.background = ""; }, 1400);
          }
          // Flash the current input field red too
          const activeEl = inputRefs.current[currentActiveIndex];
          if (activeEl) {
            activeEl.style.transition = "background 0.15s";
            activeEl.style.background = "#fee2e2";
            setTimeout(() => { activeEl.style.background = ""; }, 1400);
          }
          setUsbWarning(
            `Barcode "${scanned}" is already in field #${duplicateIndex + 1} — skipped`,
          );
          setTimeout(() => setUsbWarning(null), 3500);
          committingRef.current = false; // release guard
          return;
        }

        // ── Write to the active slot ────────────────────────────────
        setSerials((prev) => {
          const next = [...prev];
          next[currentActiveIndex] = scanned;
          serialsRef.current = next; // keep ref in sync immediately
          return next;
        });

        // ── Advance to next empty slot ──────────────────────────────
        // Search from index 0 in the updated array (using the just-written
        // serialsRef so we have the latest values without waiting for a
        // re-render).
        const updatedSerials = [...serialsRef.current];
        updatedSerials[currentActiveIndex] = scanned;

        const nextEmpty = updatedSerials.findIndex(
          (s, i) => i !== currentActiveIndex && s.trim() === "",
        );

        const nextIdx = nextEmpty !== -1 ? nextEmpty : null;
        setActiveIndex(nextIdx);
        activeIdxRef.current = nextIdx;

        if (nextIdx !== null) {
          setTimeout(() => inputRefs.current[nextIdx]?.focus(), 50);
        }

        // Release the commit guard after a small delay to absorb any
        // duplicate Enter events the scanner may fire in quick succession.
        setTimeout(() => { committingRef.current = false; }, 300);
        return;
      }

      // ── Accumulate scanner characters ────────────────────────────
      // USB scanners send characters < 50–80 ms apart.
      if (
        e.key.length === 1 &&
        (timeDiff < 80 || scanBufferRef.current.length > 0)
      ) {
        // Prevent the character from landing in the focused text input
        // while in USB mode (we manage the value ourselves)
        e.preventDefault();
        scanBufferRef.current += e.key;
        setScanBuffer(scanBufferRef.current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // Intentionally empty — all state is read through refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Camera scanner ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraOpen) { stopCamera(); return; }
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

    const now = Date.now();
    if (
      lastScannedRef.current.code === trimmed &&
      now - lastScannedRef.current.time < 2000
    ) return;
    lastScannedRef.current = { code: trimmed, time: now };

    setSerials((prev) => {
      const targetIdx = prev.findIndex((s) => s === "");
      if (targetIdx === -1) return prev;

      // Value-based duplicate guard
      if (prev.some((s, i) => i !== targetIdx && s.trim() === trimmed)) return prev;

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
    setSerials((prev) => { const next = [...prev]; next[index] = ""; return next; });
  }, []);

  const clearAll = useCallback(() => {
    setSerials(Array.from({ length: quantity }, () => ""));
  }, [quantity]);

  const filled       = serials.filter((s) => s.trim() !== "").length;
  const duplicates   = serials.filter((s) => s.trim() !== "").filter((s, i, arr) => arr.indexOf(s) !== i);
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
                setUsbWarning(null);
                const firstEmpty = serials.findIndex((s) => s === "");
                const idx = firstEmpty !== -1 ? firstEmpty : 0;
                setActiveIndex(idx);
                activeIdxRef.current = idx;
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

      {/* USB mode banner */}
      {scanMode === "usb" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-sm text-amber-800">
          <Barcode className="h-4 w-4 shrink-0" />
          <span>
            USB scanner mode — scan barcode with USB scanner.
            {activeIndex !== null && !usbWarning && (
              <strong> Scanning into field #{activeIndex + 1}</strong>
            )}
            {scanBuffer && !usbWarning && (
              <span className="ml-2 font-mono bg-amber-100 px-2 py-0.5 rounded text-amber-900">
                {scanBuffer}▌
              </span>
            )}
          </span>
        </div>
      )}

      {/* USB duplicate warning */}
      {scanMode === "usb" && usbWarning && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center gap-2 text-sm text-red-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {usbWarning}
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
            <button type="button" onClick={() => setCameraOpen(false)} className="text-primary/40 hover:text-primary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          {cameraError ? (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" /> {cameraError}
            </div>
          ) : (
            <div id={scannerDivId} className="rounded-lg overflow-hidden max-w-sm mx-auto" style={{ minHeight: 200 }} />
          )}
          <p className="text-xs text-primary/70 mt-2 text-center">
            Point your camera at a barcode — it will auto-fill and advance to the next field
          </p>
        </div>
      )}

      {/* Resume camera */}
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
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(filled / quantity) * 100}%` }} />
      </div>

      {/* Input grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
        {serials.map((serial, index) => {
          const isDuplicate = serial.trim() !== "" && serials.some((s, i) => i !== index && s.trim() === serial.trim());
          const isFilled    = serial.trim() !== "";
          const isActive    = activeIndex === index;
          const hasError    = showErrors && !isFilled;

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
                  onFocus={() => {
                    setActiveIndex(index);
                    activeIdxRef.current = index;
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  disabled={disabled}
                  placeholder={
                    isActive && scanMode !== "manual" ? "Awaiting scan..." : `Identifier #${index + 1}`
                  }
                  className={`flex-1 text-sm h-10 px-3 py-2 bg-transparent outline-none placeholder:text-muted-foreground font-mono ${
                    disabled ? "cursor-not-allowed opacity-60" : ""
                  }`}
                />
                {isFilled && !disabled && (
                  <button type="button" onClick={() => clearSerial(index)} className="pr-2 text-gray-300 hover:text-red-400 transition-colors">
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
                {isDuplicate && <AlertCircle className="h-4 w-4 text-red-500 mr-2 shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {filled > 0 && (
        <div className="border-t border-primary/10 bg-primary/5 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            {filled === quantity ? (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> All {quantity} identifiers entered
              </span>
            ) : (
              `${quantity - filled} remaining`
            )}
          </span>
          {hasDuplicates && (
            <span className="text-red-500 font-medium">⚠ Remove duplicate identifiers before saving</span>
          )}
        </div>
      )}
    </div>
  );
}
