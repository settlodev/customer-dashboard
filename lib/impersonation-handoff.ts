import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

/**
 * Opaque, short-lived handoff blob for staff impersonation ("login on behalf").
 *
 * Admin runs on `admin.*` and the customer app on the apex domain, so they
 * can't share the httpOnly session cookie. The admin action seals the minted
 * customer tokens into this blob and returns a `…/impersonate/consume?h=<blob>`
 * URL; the customer-origin consume route opens it and establishes a first-party
 * session. The raw bearer tokens therefore never travel in the URL — only this
 * AES-256-GCM ciphertext, valid for at most {@link MAX_AGE_MS}.
 */

const MAX_AGE_MS = 120_000; // 2 minutes — just long enough to open the new tab.
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

export interface ImpersonationHandoff {
  accessToken: string;
  refreshToken: string;
  accountId: string;
  appId?: string;
  impersonatorId?: string;
  /** Epoch ms the blob was sealed at; enforced on open. */
  iat: number;
}

/**
 * Derive a 32-byte key from the configured secret. We hash rather than require
 * an exact 32-byte secret so any sufficiently-random env value works.
 */
function handoffKey(): Buffer {
  const secret = process.env.IMPERSONATION_HANDOFF_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "IMPERSONATION_HANDOFF_SECRET is not set (or too short) — impersonation handoff is disabled.",
    );
  }
  return createHash("sha256").update(secret).digest();
}

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * Seal an impersonation payload into a URL-safe `iv.tag.ciphertext` blob.
 * `iat` is stamped here so callers don't need a clock.
 */
export function sealHandoff(
  payload: Omit<ImpersonationHandoff, "iat"> & { iat?: number },
): string {
  const key = handoffKey();
  const iv = randomBytes(IV_BYTES);
  const full: ImpersonationHandoff = { ...payload, iat: payload.iat ?? Date.now() };
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(full), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${b64urlEncode(iv)}.${b64urlEncode(tag)}.${b64urlEncode(ciphertext)}`;
}

/**
 * Open a handoff blob. Returns null on any tampering, malformed input, missing
 * secret, or age beyond {@link MAX_AGE_MS} — callers treat null as "expired".
 */
export function openHandoff(blob: string | null | undefined): ImpersonationHandoff | null {
  if (!blob) return null;
  const parts = blob.split(".");
  if (parts.length !== 3) return null;
  try {
    const key = handoffKey();
    const [ivB64, tagB64, ctB64] = parts;
    const decipher = createDecipheriv(ALGORITHM, key, b64urlDecode(ivB64));
    decipher.setAuthTag(b64urlDecode(tagB64));
    const plaintext = Buffer.concat([
      decipher.update(b64urlDecode(ctB64)),
      decipher.final(),
    ]).toString("utf8");
    const parsed = JSON.parse(plaintext) as ImpersonationHandoff;
    if (
      typeof parsed?.accessToken !== "string" ||
      typeof parsed?.refreshToken !== "string" ||
      typeof parsed?.accountId !== "string" ||
      typeof parsed?.iat !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.iat > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    // Bad auth tag, wrong key, or malformed blob — indistinguishable on purpose.
    return null;
  }
}
