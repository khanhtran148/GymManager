import type { AxiosError } from "axios";

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    value !== null &&
    typeof value === "object" &&
    ("title" in value || "detail" in value || "status" in value)
  );
}

function isAxiosError(error: unknown): error is AxiosError {
  return (
    error !== null &&
    typeof error === "object" &&
    "isAxiosError" in error &&
    (error as Record<string, unknown>).isAxiosError === true
  );
}

/**
 * Extracts a human-readable error message from an unknown error value.
 *
 * Priority:
 * 1. ProblemDetails.detail from AxiosError response data
 * 2. ProblemDetails.title from AxiosError response data
 * 3. Validation errors joined from ProblemDetails.errors
 * 4. AxiosError.message
 * 5. Error.message for generic Error instances
 * 6. Fallback generic message
 */
export function parseApiError(error: unknown): string {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data;

    if (isProblemDetails(data)) {
      if (data.detail) return data.detail;

      if (data.errors) {
        const messages = Object.values(data.errors).flat();
        if (messages.length > 0) return messages.join(" ");
      }

      if (data.title) return data.title;
    }

    if (error.message) return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
