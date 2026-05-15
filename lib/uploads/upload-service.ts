import { getUploadPresignUrl } from "@/lib/actions/upload-actions";

import type {
  UploadOptions,
  UploadPresignResult,
  UploadResult,
} from "./types";

/**
 * Reusable client for direct-to-R2 uploads. Flow per call:
 *
 *   1. Ask the owning backend service for a presigned PUT URL — that
 *      service is the one that enforces tenant scope, allowed content
 *      types, and size caps for the given purpose.
 *   2. PUT the file bytes straight to R2 over that URL. Browser ⇄ R2,
 *      no proxy hop — uploads scale with the user's connection and the
 *      Next.js server never holds the payload.
 *   3. Resolve with the public URL the caller should persist on the
 *      relevant entity (e.g. write `logoUrl` back via the business
 *      update endpoint).
 *
 * The XHR transport is deliberate: fetch can't report upload progress
 * without ReadableStream uploads, which aren't broadly available yet.
 */
export class UploadService {
  async upload(options: UploadOptions): Promise<UploadResult> {
    const { file, purpose, onProgress, signal } = options;
    signal?.throwIfAborted();

    const presign = await this.requestPresign(file, purpose);
    signal?.throwIfAborted();

    await this.putToBucket(presign, file, onProgress, signal);

    return {
      url: presign.publicUrl,
      key: presign.key,
      contentType: file.type,
      size: file.size,
      filename: file.name,
    };
  }

  private async requestPresign(
    file: File,
    purpose: UploadOptions["purpose"],
  ): Promise<UploadPresignResult> {
    const result = await getUploadPresignUrl({
      purpose,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      contentLength: file.size,
    });
    if (!result.ok) {
      throw new UploadError(result.message);
    }
    return result.data;
  }

  private putToBucket(
    presign: UploadPresignResult,
    file: File,
    onProgress: UploadOptions["onProgress"],
    signal: AbortSignal | undefined,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(presign.method || "PUT", presign.uploadUrl, true);

      for (const [key, value] of Object.entries(presign.requiredHeaders ?? {})) {
        xhr.setRequestHeader(key, value);
      }

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
          });
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(
            new UploadError(
              `Upload failed (${xhr.status} ${xhr.statusText || "error"})`,
            ),
          );
        }
      };

      xhr.onerror = () =>
        reject(
          new UploadError(
            "Network error while uploading — check connection or CORS policy on the bucket",
          ),
        );
      xhr.onabort = () => reject(new UploadError("Upload aborted"));

      if (signal) {
        if (signal.aborted) {
          xhr.abort();
          return;
        }
        signal.addEventListener("abort", () => xhr.abort(), { once: true });
      }

      xhr.send(file);
    });
  }
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export const uploadService = new UploadService();
