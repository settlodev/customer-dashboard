import Image from "next/image";
import { BusinessIdentity, DocumentMeta } from "../types";
import { getDocumentTitle } from "../utils/format";

interface DocumentHeaderProps {
  issuer: BusinessIdentity;
  meta: DocumentMeta;
  /**
   * Per-tenant brand colour applied to the big document title (e.g.
   * "Purchase Requisition"). When unset, falls back to the slate default.
   */
  titleColor?: string;
}

export function DocumentHeader({ issuer, meta, titleColor }: DocumentHeaderProps) {
  const title = meta.titleOverride ?? getDocumentTitle(meta.type);
  const titleClass = titleColor
    ? "text-3xl font-light tracking-wide"
    : "text-3xl font-light tracking-wide text-slate-900";

  return (
    <header className="flex items-start justify-between gap-8 border-b border-slate-200 px-10 pb-6 pt-10">
      <div className="flex items-center gap-4">
        {issuer.logoUrl && (
          <div className="relative h-16 w-16 shrink-0">
            <Image
              src={issuer.logoUrl}
              alt={`${issuer.name} logo`}
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
        )}
      </div>

      <div className="text-right">
        <h1
          className={titleClass}
          style={titleColor ? { color: titleColor } : undefined}
        >
          {title}
        </h1>
        {issuer.tin && (
          <div className="mt-1 text-xs text-slate-500">TIN: {issuer.tin}</div>
        )}
        {issuer.vrn && (
          <div className="text-xs text-slate-500">VRN: {issuer.vrn}</div>
        )}

        <div className="mt-4 space-y-0.5 text-xs leading-relaxed">
          <div className="text-base font-semibold text-slate-900">
            {issuer.legalName ?? issuer.name}
          </div>
          {issuer.addressLines.map((line, idx) => (
            <div key={idx} className="text-slate-600">
              {line}
            </div>
          ))}
          {(issuer.phone || issuer.email || issuer.website) && (
            <div className="pt-2 text-slate-600">
              {issuer.phone && <div>Mobile: {issuer.phone}</div>}
              {issuer.email && <div>{issuer.email}</div>}
              {issuer.website && <div>{issuer.website}</div>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
