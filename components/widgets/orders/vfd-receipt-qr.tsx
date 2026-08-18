"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * Thin client wrapper around `qrcode.react` so the (server-rendered) VFD
 * printable receipt can embed a verification QR code without pulling a
 * third-party component into the RSC tree directly.
 */
export function VfdReceiptQr({
  value,
  size = 120,
}: {
  value: string;
  size?: number;
}) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      includeMargin={false}
    />
  );
}
