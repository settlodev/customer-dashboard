import { FormResponse } from "@/types/types";
import { parseStringify } from "@/lib/utils";

export class SettloErrorHandler {
  static extractMessage(
    error: unknown,
    fallback = "Something went wrong while processing your request, please try again",
  ): string {
    if (!error) return fallback;

    if (typeof error === "string") return error;

    if (Array.isArray(error)) {
      return SettloErrorHandler.formatValidationErrors(error, fallback);
    }

    if (typeof error === "object" && error !== null && "message" in error) {
      const msg = (error as { message: unknown }).message;
      return SettloErrorHandler.extractMessage(msg, fallback);
    }

    if (typeof error === "object" && error !== null && "details" in error) {
      const details = (error as { details: unknown }).details;
      if (details && typeof details === "object" && "message" in details) {
        return SettloErrorHandler.extractMessage(
          (details as { message: unknown }).message,
          fallback,
        );
      }
    }

    return fallback;
  }

  static createErrorResponse(error: unknown, fallback?: string): FormResponse {
    const message = SettloErrorHandler.extractMessage(
      SettloErrorHandler.getNestedMessage(error),
      fallback,
    );

    const formResponse: FormResponse = {
      responseType: "error",
      message,
      error: error instanceof Error ? error : new Error(message),
    };

    return parseStringify(formResponse);
  }

  static createError(error: unknown, fallback?: string): Error {
    const message = SettloErrorHandler.extractMessage(
      SettloErrorHandler.getNestedMessage(error),
      fallback,
    );

    return new Error(message);
  }

  static createSuccessResponse<T = unknown>(
    message: string,
    data?: T,
  ): FormResponse<T> {
    const formResponse: FormResponse<T> = {
      responseType: "success",
      message,
      ...(data !== undefined && { data }),
    };

    return parseStringify(formResponse);
  }

  static hasErrorCode(error: unknown, code: string): boolean {
    if (typeof error === "object" && error !== null && "code" in error) {
      return (error as { code: string }).code === code;
    }
    return false;
  }

  /**
   * Checks if the caught error has a specific HTTP status.
   */
  static hasStatus(error: unknown, status: number): boolean {
    if (typeof error === "object" && error !== null && "status" in error) {
      return (error as { status: number }).status === status;
    }
    return false;
  }

  static messageContains(error: unknown, substring: string): boolean {
    const message = SettloErrorHandler.extractMessage(error, "");
    return message.toLowerCase().includes(substring.toLowerCase());
  }

  static safeMessage(
    message: unknown,
    fallback = "Operation completed",
  ): string {
    if (typeof message === "string") return message;
    return SettloErrorHandler.extractMessage(message, fallback);
  }

  private static humanizeFieldName(field: string): string {
    // If dot-notation (e.g. "customer.firstName"), use only the last segment
    const segment = field.includes(".") ? field.split(".").pop()! : field;

    // Insert space before each uppercase letter, then lowercase everything
    return segment
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
  }

  private static formatValidationErrors(
    errors: unknown[],
    fallback: string,
  ): string {
    // Extract { field, message } entries
    const parsed = errors
      .map((entry) => {
        if (typeof entry === "string") return { field: "", message: entry };
        if (entry && typeof entry === "object" && "message" in entry) {
          const field = "field" in entry ? String(entry.field) : "";
          const msg = String(entry.message);
          return { field, message: msg };
        }
        return null;
      })
      .filter(Boolean) as { field: string; message: string }[];

    if (parsed.length === 0) return fallback;

    const nullMessages = [
      "must not be null",
      "must not be blank",
      "must not be empty",
      "is required",
    ];
    const allRequired = parsed.every((p) =>
      nullMessages.some((nm) => p.message.toLowerCase().includes(nm)),
    );

    if (allRequired && parsed.every((p) => p.field)) {
      const fieldNames = parsed
        .map((p) => SettloErrorHandler.humanizeFieldName(p.field))
        .join(", ");
      return `Please fill in the required fields: ${fieldNames}`;
    }

    const lines = parsed.map((p) => {
      if (p.field) {
        return `${SettloErrorHandler.humanizeFieldName(p.field)}: ${p.message}`;
      }
      return p.message;
    });
    return lines.join(", ");
  }

  private static getNestedMessage(error: unknown): unknown {
    if (!error || typeof error !== "object") return error;

    const err = error as Record<string, unknown>;

    // Prefer details.message if it exists (more specific from API)
    if (err.details && typeof err.details === "object") {
      const details = err.details as Record<string, unknown>;
      if ("message" in details && details.message) {
        return details.message;
      }
    }

    // Fall back to top-level message
    if ("message" in err && err.message) {
      return err.message;
    }

    return error;
  }
}
