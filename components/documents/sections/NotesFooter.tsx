import Image from "next/image";
import { BankDetails } from "../types";

interface NotesFooterProps {
  notes?: string;
  bankDetails?: BankDetails;
  signatures?: { label: string; name?: string; date?: string }[];
  footerMessage?: string;
}

export function NotesFooter({
  notes,
  bankDetails,
  signatures,
  footerMessage = "Thank you for your business and continued support",
}: NotesFooterProps) {
  const hasNotesSection = notes || bankDetails;

  return (
    <>
      <footer className="mt-2">
        {hasNotesSection && (
          <section className="px-10 pb-6 pt-2 text-xs leading-relaxed">
            <div className="mb-2 font-medium text-slate-900">Notes / Terms</div>
            {notes && (
              <div className="whitespace-pre-line text-slate-600">{notes}</div>
            )}
            {bankDetails && (
              <div className="mt-2 text-slate-600">
                <div>You can make your payment through:</div>
                <div>
                  Cash deposit / cheque: {bankDetails.accountName},
                </div>
                <div>{bankDetails.bankName},</div>
                {bankDetails.branch && <div>{bankDetails.branch},</div>}
                <div>Account No: {bankDetails.accountNumber}</div>
                {bankDetails.swiftCode && (
                  <div>SWIFT: {bankDetails.swiftCode}</div>
                )}
              </div>
            )}
          </section>
        )}

        {signatures && signatures.length > 0 && (
          <section className="grid gap-8 px-10 pb-6 sm:grid-cols-2">
            {signatures.map((sig, idx) => (
              <div key={idx} className="text-xs">
                <div className="mt-8 border-t border-slate-400 pt-1.5">
                  <div className="font-medium text-slate-900">{sig.label}</div>
                  {sig.name && <div className="text-slate-600">{sig.name}</div>}
                  {sig.date && <div className="text-slate-500">{sig.date}</div>}
                </div>
              </div>
            ))}
          </section>
        )}

        {footerMessage && (
          <div className="border-t border-slate-200 px-10 py-4 text-center text-xs text-slate-500">
            {footerMessage}
          </div>
        )}
      </footer>

      {/* Powered by Settlo — pinned to the absolute bottom of the A4 sheet */}
      <div className="mt-auto flex items-center justify-center gap-2 px-10 py-4 text-[11px] text-slate-400">
        <span>Powered by</span>
        <Image
          src="/images/logo_new.png"
          alt="Settlo"
          width={120}
          height={32}
          className="h-6 w-auto opacity-70"
        />
      </div>
    </>
  );
}
