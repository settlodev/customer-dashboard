"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface WhatsAppButtonProps {
  userName?: string;
  businessName?: string;
  locationName?: string;
  phoneNumber?: string;
  customMessage?: string;
  /** Set to true to hide this button on /reserve pages (used by global instance) */
  hideOnReserve?: boolean;
}

const SETTLO_PHONE = "255759229777";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    fill="white"
    className={className}
  >
    <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.32 22.616c-.39 1.1-1.932 2.014-3.168 2.28-.846.18-1.95.324-5.67-1.218-4.762-1.972-7.826-6.8-8.064-7.114-.23-.314-1.932-2.572-1.932-4.904s1.222-3.478 1.656-3.956c.434-.478.948-.598 1.264-.598.314 0 .632.004.908.016.292.014.684-.11 1.07.816.39.944 1.328 3.236 1.444 3.47.118.234.196.508.04.82-.158.314-.236.508-.47.784-.236.274-.496.614-.708.824-.236.236-.482.49-.208.962.274.47 1.22 2.014 2.62 3.264 1.802 1.608 3.32 2.106 3.792 2.34.47.234.748.196 1.022-.118.274-.314 1.178-1.374 1.492-1.846.314-.47.632-.39 1.064-.234.434.158 2.724 1.284 3.192 1.518.47.234.78.352.898.546.118.196.118 1.126-.272 2.228z" />
  </svg>
);

function buildMessage({
  userName,
  businessName,
  locationName,
}: WhatsAppButtonProps): string {
  if (userName && businessName && locationName) {
    return `Hello Settlo, my name is ${userName} from ${businessName} (${locationName}). I need help with`;
  }
  if (userName && businessName) {
    return `Hello Settlo, my name is ${userName} from ${businessName}. I need help with`;
  }
  if (userName) {
    return `Hello Settlo, my name is ${userName}. I need help with`;
  }
  return "Hello Settlo, I need help";
}

function sanitizePhone(phone: string): string {
  return phone.replace(/[\s\-()+ ]/g, "").replace(/^0/, "255");
}

export default function WhatsAppButton({
  userName,
  businessName,
  locationName,
  phoneNumber,
  customMessage,
  hideOnReserve,
}: WhatsAppButtonProps) {
  const pathname = usePathname();

  if (hideOnReserve && pathname.startsWith("/reserve")) return null;

  const message =
    customMessage || buildMessage({ userName, businessName, locationName });
  const phone = phoneNumber ? sanitizePhone(phoneNumber) : SETTLO_PHONE;
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110 active:scale-95"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </Link>
  );
}

export { WhatsAppIcon };
