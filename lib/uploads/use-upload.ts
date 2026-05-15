"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { uploadService } from "./upload-service";
import type {
  UploadOptions,
  UploadProgress,
  UploadResult,
} from "./types";

interface UseUploadState {
  isUploading: boolean;
  progress: UploadProgress | null;
  error: Error | null;
  result: UploadResult | null;
}

const INITIAL_STATE: UseUploadState = {
  isUploading: false,
  progress: null,
  error: null,
  result: null,
};

/**
 * React hook over {@link UploadService}. Tracks per-upload state
 * (progress, error, last result), surfaces a {@code cancel()} that
 * aborts an in-flight PUT, and aborts cleanly on unmount so a slow
 * upload doesn't outlive the form that started it.
 */
export function useUpload() {
  const [state, setState] = useState<UseUploadState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const upload = useCallback(
    async (
      options: Omit<UploadOptions, "signal" | "onProgress">,
    ): Promise<UploadResult> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ ...INITIAL_STATE, isUploading: true });

      try {
        const result = await uploadService.upload({
          ...options,
          signal: controller.signal,
          onProgress: (progress) =>
            setState((prev) => ({ ...prev, progress })),
        });
        setState({ ...INITIAL_STATE, result });
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ ...INITIAL_STATE, error: err });
        throw err;
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  return { ...state, upload, cancel, reset };
}
