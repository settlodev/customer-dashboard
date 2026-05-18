"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Copy,
  Home,
  Mail,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PermissionDeniedProps {
  /** Friendly explanation. Falls back to a generic message if omitted. */
  message?: string;
  /** Server-side request ID, surfaced so support can trace the call. */
  correlationId?: string;
  /**
   * Optional permission key the action required (e.g. "inventory.write").
   * Rendered as a tag so users know what to ask their admin for.
   */
  requiredPermission?: string;
  /**
   * Where the secondary button sends the user. Defaults to /dashboard.
   * The (warehouse) layout overrides this to /warehouse.
   */
  homeHref?: string;
  homeLabel?: string;
}

/**
 * Shown when a server action / loader returns a 403 FORBIDDEN. Replaces the
 * generic "Something went wrong" page so users understand it's an access
 * issue, not an outage.
 */
export default function PermissionDenied({
  message,
  correlationId,
  requiredPermission,
  homeHref = "/dashboard",
  homeLabel = "Dashboard",
}: PermissionDeniedProps) {
  const router = useRouter();
  const reduce = useReducedMotion();

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[26rem] w-[26rem] rounded-full bg-[hsl(var(--neg)/0.06)] blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-[hsl(var(--primary)/0.06)] blur-3xl" />
      </div>

      <motion.div
        role="alert"
        aria-live="polite"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full max-w-md rounded-2xl border border-line bg-card shadow-sm"
      >
        <div className="flex flex-col items-center p-8 text-center">
          <PermissionShield />

          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,hsl(var(--neg))_22%,transparent)] bg-[hsl(var(--neg)/0.08)] px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[hsl(var(--neg))]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--neg))]" />
            403 · Forbidden
          </span>

          <h1 className="mt-3 text-[22px] font-semibold leading-tight tracking-tight text-ink">
            Permission denied
          </h1>
          <p className="mt-2 max-w-sm text-[13.5px] leading-snug text-ink-3 text-pretty">
            {message ||
              "You don't have access to view this page or perform this action. If you think this is a mistake, ask your administrator to grant the required permission."}
          </p>

          {requiredPermission && (
            <div className="mt-5 flex items-center gap-2 rounded-md border border-line bg-canvas px-2.5 py-1.5">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                Requires
              </span>
              <code className="font-mono text-[12px] font-medium text-ink">
                {requiredPermission}
              </code>
            </div>
          )}

          <div className="mt-7 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="accent"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={homeHref}>
                <Home className="h-4 w-4" />
                {homeLabel}
              </Link>
            </Button>
          </div>

          <div className="mt-7 w-full border-t border-line pt-4">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between">
              {correlationId ? (
                <CorrelationIdRow id={correlationId} />
              ) : (
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-2">
                  No reference ID
                </span>
              )}
              <a
                href="mailto:support@settlo.co.tz"
                className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2 hover:text-primary transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                Contact support
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PermissionShield() {
  const reduce = useReducedMotion();
  return (
    <div className="relative grid h-16 w-16 place-items-center">
      {!reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[hsl(var(--neg)/0.18)]"
          initial={{ opacity: 0.6, scale: 0.85 }}
          animate={{ opacity: 0, scale: 1.35 }}
          transition={{
            duration: 2.4,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: 0.4,
          }}
        />
      )}
      <div className="relative grid h-16 w-16 place-items-center rounded-full bg-[hsl(var(--neg)/0.10)] ring-1 ring-[color-mix(in_oklab,hsl(var(--neg))_22%,transparent)]">
        <ShieldOff className="h-7 w-7 text-[hsl(var(--neg))]" strokeWidth={1.75} />
      </div>
    </div>
  );
}

function CorrelationIdRow({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable (insecure context / permissions) — silent
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied" : "Copy reference ID"}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-canvas"
    >
      <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
        Ref
      </span>
      <code className="truncate font-mono text-[11.5px] text-ink-2">{id}</code>
      {copied ? (
        <Check className="h-3 w-3 flex-shrink-0 text-[hsl(var(--pos))]" />
      ) : (
        <Copy className="h-3 w-3 flex-shrink-0 text-muted-2 transition-colors group-hover:text-ink-2" />
      )}
    </button>
  );
}

/**
 * True when the error is a 403 FORBIDDEN from the API client. Handles both
 * direct ErrorResponseType objects and the serialized Error form server
 * actions produce (where the structured error survives only as JSON in
 * `error.message`).
 *
 * Note: more specific 403 codes (ACCOUNT_LOCKED, ACCOUNT_DISABLED) are
 * mapped to their own codes upstream in handleSettloApiError, so this only
 * matches the generic FORBIDDEN case.
 */
export function isPermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as Record<string, unknown>;

  // Primary: digest is the only reliable signal across the RSC boundary in
  // production — set by SettloApiError to err.code.
  if (typeof err.digest === "string" && err.digest === "FORBIDDEN") return true;

  // Same-context throws: structured error has the code directly.
  if (typeof err.code === "string" && err.code === "FORBIDDEN") return true;

  // Dev-mode fallback: error.message may contain the JSON when the throw
  // happened from a plain object before SettloApiError wrapping landed.
  if (err instanceof Error || typeof err.message === "string") {
    const msg = String(err.message || "");
    try {
      const parsed = JSON.parse(msg);
      if (typeof parsed?.code === "string" && parsed.code === "FORBIDDEN") {
        return true;
      }
    } catch {
      if (msg.includes('"code":"FORBIDDEN"')) return true;
    }
  }

  return false;
}

/**
 * Pull a user-facing message, correlation ID, and (when present) the required
 * permission out of an error shape that may be either the structured
 * ErrorResponseType or a server-action Error whose `message` is the
 * JSON-stringified ErrorResponseType.
 */
export function extractPermissionDeniedDetails(error: unknown): {
  message?: string;
  correlationId?: string;
  requiredPermission?: string;
} {
  if (!error || typeof error !== "object") return {};
  const err = error as Record<string, unknown>;

  let source: Record<string, unknown> = err;
  if (typeof err.message === "string") {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed && typeof parsed === "object") {
        source = parsed as Record<string, unknown>;
      }
    } catch {
      // not JSON — fall back to the raw error
    }
  }

  const rawMessage =
    typeof source.message === "string" ? source.message : undefined;
  // Drop the bare "Access Denied" string in favour of the friendlier default.
  const message =
    rawMessage && rawMessage.toLowerCase() !== "access denied"
      ? rawMessage
      : undefined;

  const details =
    source.details && typeof source.details === "object"
      ? (source.details as Record<string, unknown>)
      : undefined;

  const requiredPermission =
    (typeof source.requiredPermission === "string" && source.requiredPermission) ||
    (typeof details?.requiredPermission === "string" && details.requiredPermission) ||
    (typeof details?.permission === "string" && details.permission) ||
    undefined;

  return {
    message,
    correlationId:
      typeof source.correlationId === "string"
        ? source.correlationId
        : undefined,
    requiredPermission: requiredPermission || undefined,
  };
}
